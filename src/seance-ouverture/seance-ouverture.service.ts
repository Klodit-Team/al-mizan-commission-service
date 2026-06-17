import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { SeanceOuverture } from './entities/seance-ouverture.entity';
import { ResultatOuverture } from './entities/resultat-ouverture.entity';
import { CommissionEvaluation } from '../commission-evaluation/entities/commission-evaluation.entity';
import { MembreEvaluation } from '../commission-evaluation/entities/membre-evaluation.entity';
import { CreateSeanceDto } from './dto/create-seance.dto';
import { UpdateSeanceDto } from './dto/update-seance.dto';
import { CreateResultatDto } from './dto/create-resultat.dto';
import { UpdateResultatDto } from './dto/update-resultat.dto';
import { OuvrirPlisDto } from './dto/ouvrir-plis.dto';
import { StatutSeance } from '../common/enums/statut-seance.enum';
import { COMMISSION_EVENTS } from '../common/messaging/events';
import { MinioService } from '../common/services/minio.service';

@Injectable()
export class SeanceOuvertureService {
  constructor(
    @InjectRepository(SeanceOuverture)
    private seanceRepository: Repository<SeanceOuverture>,
    @InjectRepository(ResultatOuverture)
    private resultatRepository: Repository<ResultatOuverture>,
    @InjectRepository(CommissionEvaluation)
    private commissionRepository: Repository<CommissionEvaluation>,
    @InjectRepository(MembreEvaluation)
    private membreRepository: Repository<MembreEvaluation>,
    @Inject('RABBITMQ_CLIENT') private rabbitClient: ClientProxy,
    private minioService: MinioService,
  ) {}

  async create(dto: CreateSeanceDto): Promise<SeanceOuverture> {
    const seance = this.seanceRepository.create({
      ...dto,
      dateSeance: new Date(dto.dateSeance),
    });

    const saved = await this.seanceRepository.save(seance);

    this.rabbitClient.emit(COMMISSION_EVENTS.SEANCE_PROGRAMMEE, {
      seanceId: saved.id,
      commissionId: saved.commissionId,
      appelOffreId: saved.appelOffreId,
      type: saved.type,
      dateSeance: saved.dateSeance,
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  async findAll(commissionId?: string): Promise<SeanceOuverture[]> {
    const query = this.seanceRepository
      .createQueryBuilder('seance')
      .leftJoinAndSelect('seance.resultats', 'resultats')
      .orderBy('seance.dateSeance', 'DESC');

    if (commissionId) {
      query.where('seance.commissionId = :commissionId', { commissionId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<SeanceOuverture> {
    const seance = await this.seanceRepository.findOne({
      where: { id },
      relations: ['resultats'],
    });

    if (!seance) {
      throw new NotFoundException(`Séance ${id} introuvable`);
    }

    return seance;
  }

  async update(id: string, dto: UpdateSeanceDto): Promise<SeanceOuverture> {
    const seance = await this.findOne(id);

    if (seance.statut === StatutSeance.TERMINEE) {
      throw new BadRequestException(
        'Impossible de modifier une séance terminée',
      );
    }

    Object.assign(seance, dto);
    if (dto.dateSeance) {
      seance.dateSeance = new Date(dto.dateSeance);
    }

    return this.seanceRepository.save(seance);
  }

  async delete(id: string): Promise<void> {
    const seance = await this.findOne(id);

    if (seance.statut !== StatutSeance.PROGRAMMEE) {
      throw new BadRequestException(
        'Seules les séances programmées peuvent être supprimées',
      );
    }

    await this.seanceRepository.remove(seance);
  }

  async demarrer(id: string): Promise<SeanceOuverture> {
    const seance = await this.findOne(id);

    if (seance.statut !== StatutSeance.PROGRAMMEE) {
      throw new BadRequestException("La séance doit être à l'état PROGRAMMEE");
    }

    seance.statut = StatutSeance.EN_COURS;
    const saved = await this.seanceRepository.save(seance);

    this.rabbitClient.emit(COMMISSION_EVENTS.SEANCE_DEMARREE, {
      seanceId: saved.id,
      commissionId: saved.commissionId,
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  async ouvrirPlis(id: string, dto: OuvrirPlisDto): Promise<SeanceOuverture> {
    const seance = await this.findOne(id);

    if (seance.statut !== StatutSeance.EN_COURS) {
      throw new BadRequestException(
        "La séance doit être à l'état EN_COURS pour ouvrir les plis",
      );
    }

    const commission = await this.commissionRepository.findOne({
      where: { id: seance.commissionId },
    });

    if (!commission) {
      throw new NotFoundException(
        `Commission d'évaluation ${seance.commissionId} introuvable`,
      );
    }

    // Vérifier le quorum
    if (dto.membresPresentsIds.length < commission.nombreMinMembres) {
      throw new BadRequestException(
        `Quorum non atteint : ${dto.membresPresentsIds.length}/${commission.nombreMinMembres} membres présents requis`,
      );
    }

    // Vérifier que chaque membre présent fait partie de la commission
    const count = await this.membreRepository.count({
      where: {
        commissionId: seance.commissionId,
        userId: In(dto.membresPresentsIds),
      },
    });

    if (count !== dto.membresPresentsIds.length) {
      throw new BadRequestException(
        'Certains membres présents ne font pas partie de cette commission',
      );
    }

    seance.membresPresentsIds = dto.membresPresentsIds;
    seance.dateOuverture = new Date();

    const saved = await this.seanceRepository.save(seance);

    this.rabbitClient.emit(COMMISSION_EVENTS.PLIS_OUVERTS, {
      seanceId: saved.id,
      commissionId: saved.commissionId,
      membresPresentsIds: saved.membresPresentsIds,
      dateOuverture: saved.dateOuverture,
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  async terminer(id: string): Promise<SeanceOuverture> {
    const seance = await this.findOne(id);

    if (seance.statut !== StatutSeance.EN_COURS) {
      throw new BadRequestException('La séance doit être EN_COURS');
    }

    seance.statut = StatutSeance.TERMINEE;
    const saved = await this.seanceRepository.save(seance);

    this.rabbitClient.emit(COMMISSION_EVENTS.SEANCE_TERMINEE, {
      seanceId: saved.id,
      commissionId: saved.commissionId,
      resultatsCount: seance.resultats?.length || 0,
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  // Résultats d'ouverture
  async getResultats(seanceId: string): Promise<ResultatOuverture[]> {
    await this.findOne(seanceId); // Verify seance exists
    return this.resultatRepository.find({
      where: { seanceId },
      order: { createdAt: 'ASC' },
    });
  }

  async addResultat(
    seanceId: string,
    dto: CreateResultatDto,
  ): Promise<ResultatOuverture> {
    const seance = await this.findOne(seanceId);

    if (seance.statut === StatutSeance.TERMINEE) {
      throw new BadRequestException(
        "Impossible d'ajouter des résultats à une séance terminée",
      );
    }

    const existing = await this.resultatRepository.findOne({
      where: { seanceId, soumissionId: dto.soumissionId },
    });

    if (existing) {
      throw new BadRequestException(
        'Résultat déjà enregistré pour cette soumission',
      );
    }

    const resultat = this.resultatRepository.create({
      seanceId,
      ...dto,
    });

    return this.resultatRepository.save(resultat);
  }

  async updateResultat(
    seanceId: string,
    resultatId: string,
    dto: UpdateResultatDto,
  ): Promise<ResultatOuverture> {
    const seance = await this.findOne(seanceId);

    if (seance.statut === StatutSeance.TERMINEE) {
      throw new BadRequestException(
        "Impossible de modifier les résultats d'une séance terminée",
      );
    }

    const resultat = await this.resultatRepository.findOne({
      where: { id: resultatId, seanceId },
    });

    if (!resultat) {
      throw new NotFoundException(`Résultat ${resultatId} introuvable`);
    }

    Object.assign(resultat, dto);
    return this.resultatRepository.save(resultat);
  }

  async deleteResultat(seanceId: string, resultatId: string): Promise<void> {
    const seance = await this.findOne(seanceId);

    if (seance.statut === StatutSeance.TERMINEE) {
      throw new BadRequestException(
        "Impossible de supprimer les résultats d'une séance terminée",
      );
    }

    const resultat = await this.resultatRepository.findOne({
      where: { id: resultatId, seanceId },
    });

    if (!resultat) {
      throw new NotFoundException(`Résultat ${resultatId} introuvable`);
    }

    await this.resultatRepository.remove(resultat);
  }

  async getPV(
    id: string,
  ): Promise<{ fileName: string; stream: NodeJS.ReadableStream }> {
    const seance = await this.findOne(id);

    if (!seance.pvUrl) {
      throw new NotFoundException('PV non généré pour cette séance');
    }

    // Extract filename from pvUrl (format: http://minio:9000/bucket/filename.pdf)
    const fileName = seance.pvUrl.split('/').pop() as string;

    const stream = await this.minioService.getFileStream(
      'commission-pv',
      fileName,
    );

    return { fileName, stream };
  }

  async generatePV(id: string): Promise<{ url: string }> {
    const seance = await this.findOne(id);

    if (seance.statut !== StatutSeance.TERMINEE) {
      throw new BadRequestException(
        'La séance doit être terminée pour générer le PV',
      );
    }

    // Generate PDF content
    const pdfBuffer = await this.generatePVPdf(seance);

    // Upload to MinIO
    const fileName = `pv-ouverture-${seance.id}-${Date.now()}.pdf`;
    const url = await this.minioService.uploadFile(
      'commission-pv',
      fileName,
      pdfBuffer,
      'application/pdf',
    );

    // Update seance with PV URL
    seance.pvUrl = url;
    await this.seanceRepository.save(seance);

    this.rabbitClient.emit(COMMISSION_EVENTS.PV_OUVERTURE_GENERATED, {
      seanceId: seance.id,
      commissionId: seance.commissionId,
      pvUrl: url,
      timestamp: new Date().toISOString(),
    });

    return { url };
  }

  private async generatePVPdf(seance: SeanceOuverture): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFDocument = require('pdfkit') as typeof import('pdfkit');

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Title
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text("PROCES-VERBAL D'OUVERTURE DES PLIS", { align: 'center' });
      doc.moveDown();

      // Seance info
      doc.fontSize(12).font('Helvetica');
      doc.text(`Reference: ${seance.id}`);
      doc.text(`Type: ${seance.type}`);
      doc.text(
        `Date: ${seance.dateSeance.toLocaleDateString('fr-FR')} a ${seance.dateSeance.toLocaleTimeString('fr-FR')}`,
      );
      doc.text(`Lieu: ${seance.lieu}`);
      doc.text(
        `Caractere: ${seance.isPublique ? 'Seance publique' : 'Seance privee'}`,
      );
      doc.moveDown();

      // Results section
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text("RESULTATS D'OUVERTURE", { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(11).font('Helvetica');
      if (seance.resultats && seance.resultats.length > 0) {
        seance.resultats.forEach((r, i) => {
          doc
            .font('Helvetica-Bold')
            .text(`${i + 1}. Soumission: ${r.soumissionId}`);
          doc.font('Helvetica');
          doc.text(`   Pli recu: ${r.pliRecu ? 'Oui' : 'Non'}`);
          doc.text(`   Pli conforme: ${r.pliConforme ? 'Oui' : 'Non'}`);
          doc.text(`   Observations: ${r.observations || 'Aucune'}`);
          doc.moveDown(0.5);
        });
      } else {
        doc.text('Aucun resultat enregistre');
      }

      doc.moveDown();
      doc
        .fontSize(10)
        .fillColor('gray')
        .text(`Genere le: ${new Date().toLocaleString('fr-FR')}`, {
          align: 'right',
        });

      doc.end();
    });
  }
}
