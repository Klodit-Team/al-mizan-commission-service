import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { CommissionMarche } from './entities/commission-marche.entity';
import { MembreMarche } from './entities/membre-marche.entity';
import { CreateCommissionMarcheDto } from './dto/create-commission-marche.dto';
import { UpdateCommissionMarcheDto } from './dto/update-commission-marche.dto';
import { AddMembreMarcheDto } from './dto/add-membre-marche.dto';
import { ChangeStatutMarcheDto } from './dto/change-statut-marche.dto';
import { DeliberationDto } from './dto/deliberation.dto';
import { AttributionDto } from './dto/attribution.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import { StatutMarche } from '../common/enums/statut-marche.enum';
import { RABBITMQ_CLIENT } from '../common/messaging/rabbitmq.module';
import { COMMISSION_EVENTS } from '../common/messaging/events';
import { MinioService } from '../common/services/minio.service';

@Injectable()
export class CommissionMarcheService {
  constructor(
    @InjectRepository(CommissionMarche)
    private readonly commissionRepo: Repository<CommissionMarche>,
    @InjectRepository(MembreMarche)
    private readonly membreRepo: Repository<MembreMarche>,
    @Inject(RABBITMQ_CLIENT)
    private readonly rmqClient: ClientProxy,
    private readonly minioService: MinioService,
  ) {}

  private emit(event: string, payload: object): void {
    this.rmqClient.emit(event, payload).subscribe({
      error: (e) => console.error(`RabbitMQ emit error [${event}]:`, e),
    });
  }

  private async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.commissionRepo.count();
    return `CM-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CommissionMarche>> {
    const { page = 1, limit = 10, statut, dateFrom, dateTo, search } = query;
    const skip = (page - 1) * limit;

    if (search) {
      const results = await this.commissionRepo
        .createQueryBuilder('cm')
        .where('cm.reference LIKE :search OR cm.intitule LIKE :search', {
          search: `%${search}%`,
        })
        .andWhere(
          statut ? 'cm.statut = :statut' : '1=1',
          statut ? { statut } : {},
        )
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return new PaginatedResponseDto(results[0], results[1], page, limit);
    }

    const where: any = {};
    if (statut) {
      where.statut = statut as StatutMarche;
    }
    if (dateFrom && dateTo) {
      where.dateOuvertureOffres = Between(new Date(dateFrom), new Date(dateTo));
    }

    const [data, total] = await this.commissionRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<CommissionMarche> {
    const commission = await this.commissionRepo.findOne({
      where: { id },
      relations: ['membres'],
    });
    if (!commission) {
      throw new NotFoundException(
        `Commission de marché avec l'ID "${id}" introuvable`,
      );
    }
    return commission;
  }

  async create(dto: CreateCommissionMarcheDto): Promise<CommissionMarche> {
    const reference = await this.generateReference();
    const commission = this.commissionRepo.create({ ...dto, reference });
    const saved = await this.commissionRepo.save(commission);
    this.emit(COMMISSION_EVENTS.MARCHE_CREATED, {
      commissionId: saved.id,
      reference: saved.reference,
      intitule: saved.intitule,
      typeMarche: saved.typeMarche,
      presidentId: saved.presidentId,
      createdAt: saved.createdAt,
    });
    return saved;
  }

  async update(
    id: string,
    dto: UpdateCommissionMarcheDto,
  ): Promise<CommissionMarche> {
    const commission = await this.findOne(id);
    Object.assign(commission, dto);
    return this.commissionRepo.save(commission);
  }

  async remove(id: string): Promise<void> {
    const commission = await this.findOne(id);
    await this.commissionRepo.remove(commission);
  }

  async changeStatut(
    id: string,
    dto: ChangeStatutMarcheDto,
  ): Promise<CommissionMarche> {
    const commission = await this.findOne(id);
    commission.statut = dto.statut;
    const saved = await this.commissionRepo.save(commission);
    this.emit(COMMISSION_EVENTS.MARCHE_STATUT_CHANGED, {
      commissionId: id,
      reference: commission.reference,
      statut: dto.statut,
      changedAt: new Date().toISOString(),
    });
    return saved;
  }

  async findMembres(id: string): Promise<MembreMarche[]> {
    await this.findOne(id);
    return this.membreRepo.find({ where: { commissionId: id } });
  }

  async addMembre(id: string, dto: AddMembreMarcheDto): Promise<MembreMarche> {
    await this.findOne(id);
    const existing = await this.membreRepo.findOne({
      where: { commissionId: id, userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException(
        'Ce membre fait déjà partie de cette commission',
      );
    }
    const membre = this.membreRepo.create({ ...dto, commissionId: id });
    return this.membreRepo.save(membre);
  }

  async removeMembre(id: string, membreId: string): Promise<void> {
    await this.findOne(id);
    const membre = await this.membreRepo.findOne({
      where: { id: membreId, commissionId: id },
    });
    if (!membre) {
      throw new NotFoundException(
        `Membre avec l'ID "${membreId}" introuvable dans cette commission`,
      );
    }
    await this.membreRepo.remove(membre);
  }

  async updateMembre(id: string, membreId: string, dto: any): Promise<any> {
    await this.findOne(id);
    const membre = await this.membreRepo.findOne({
      where: { id: membreId, commissionId: id },
    });
    if (!membre) {
      throw new NotFoundException(
        `Membre avec l'ID "${membreId}" introuvable dans cette commission`,
      );
    }
    Object.assign(membre, dto);
    return this.membreRepo.save(membre);
  }

  async setDeliberation(
    id: string,
    dto: DeliberationDto,
  ): Promise<CommissionMarche> {
    const commission = await this.findOne(id);
    commission.pvDeliberation = dto.pvDeliberation;
    commission.statut = StatutMarche.DELIBERATION;
    if (dto.soumissionnairesCount !== undefined) {
      commission.soumissionnairesCount = dto.soumissionnairesCount;
    }
    const saved = await this.commissionRepo.save(commission);
    this.emit(COMMISSION_EVENTS.MARCHE_PV_GENERATED, {
      commissionId: id,
      reference: commission.reference,
      soumissionnairesCount: commission.soumissionnairesCount,
      generatedAt: new Date().toISOString(),
    });
    return saved;
  }

  async getDeliberation(
    id: string,
  ): Promise<{ pvDeliberation: string | null; commissionId: string }> {
    const commission = await this.findOne(id);
    return {
      commissionId: id,
      pvDeliberation: commission.pvDeliberation,
    };
  }

  async attribuerMarche(
    id: string,
    dto: AttributionDto,
  ): Promise<CommissionMarche> {
    const commission = await this.findOne(id);
    commission.statut = StatutMarche.ATTRIBUEE;
    commission.soumissionnairesRetenu = dto.soumissionnairesRetenu;
    const saved = await this.commissionRepo.save(commission);
    this.emit(COMMISSION_EVENTS.MARCHE_ATTRIBUTED, {
      commissionId: id,
      reference: commission.reference,
      soumissionnairesRetenu: dto.soumissionnairesRetenu,
      attributedAt: new Date().toISOString(),
    });
    return saved;
  }

  async exportPdf(id: string): Promise<{ buffer: Buffer; fileName: string }> {
    const commission = await this.findOne(id);
    const membres = await this.findMembres(id);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDFDocument = require('pdfkit');

    const buffer = await new Promise<Buffer>((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Title
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('COMMISSION DE MARCHE', { align: 'center' });
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(commission.reference, { align: 'center' });
      doc.moveDown();

      // Commission info
      doc.fontSize(12).font('Helvetica');
      doc.text(`Intitule: ${commission.intitule}`);
      doc.text(`Type: ${commission.typeMarche}`);
      doc.text(
        `Montant estime: ${commission.montantEstime || 'Non specifie'} DZD`,
      );
      doc.text(
        `Date d'ouverture: ${commission.dateOuvertureOffres || 'Non programmee'}`,
      );
      doc.text(
        `Date de deliberation: ${commission.dateDeliberations || 'Non programmee'}`,
      );
      doc.text(`Statut: ${commission.statut}`);
      doc.moveDown();

      // Members section
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('MEMBRES DE LA COMMISSION', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      membres.forEach((m, i) => {
        doc.text(`${i + 1}. ${m.prenom} ${m.nom} - ${m.role}`);
      });
      doc.moveDown();

      // Results section
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('RESULTATS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(
        `Nombre de soumissionnaires: ${commission.soumissionnairesCount}`,
      );
      doc.text(
        `Soumissionnaire retenu: ${commission.soumissionnairesRetenu || 'Non attribue'}`,
      );
      doc.moveDown();

      // PV section
      if (commission.pvDeliberation) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('PV DE DELIBERATION', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(commission.pvDeliberation);
        doc.moveDown();
      }

      doc
        .fontSize(10)
        .fillColor('gray')
        .text(`Genere le: ${new Date().toLocaleString('fr-FR')}`, {
          align: 'right',
        });

      doc.end();
    });

    const fileName = `commission-marche-${commission.reference}.pdf`;
    return { buffer, fileName };
  }
}
