import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { CommissionEvaluation } from './entities/commission-evaluation.entity';
import { MembreEvaluation } from './entities/membre-evaluation.entity';
import { CreateCommissionEvaluationDto } from './dto/create-commission-evaluation.dto';
import { UpdateCommissionEvaluationDto } from './dto/update-commission-evaluation.dto';
import { AddMembreEvaluationDto } from './dto/add-membre-evaluation.dto';
import { ChangeStatutEvaluationDto } from './dto/change-statut-evaluation.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import { StatutEvaluation } from '../common/enums/statut-evaluation.enum';
import { RABBITMQ_CLIENT } from '../common/messaging/rabbitmq.module';
import { COMMISSION_EVENTS } from '../common/messaging/events';
import { MinioService } from '../common/services/minio.service';

@Injectable()
export class CommissionEvaluationService {
  constructor(
    @InjectRepository(CommissionEvaluation)
    private readonly commissionRepo: Repository<CommissionEvaluation>,
    @InjectRepository(MembreEvaluation)
    private readonly membreRepo: Repository<MembreEvaluation>,
    @Inject(RABBITMQ_CLIENT)
    private readonly rmqClient: ClientProxy,
    private readonly minioService: MinioService,
  ) {}

  private emit(event: string, payload: object): void {
    this.rmqClient.emit(event, payload).subscribe({ error: (e) => console.error(`RabbitMQ emit error [${event}]:`, e) });
  }

  private async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.commissionRepo.count();
    return `CE-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<CommissionEvaluation>> {
    const { page = 1, limit = 10, statut, dateFrom, dateTo, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (statut) {
      where.statut = statut as StatutEvaluation;
    }

    if (dateFrom && dateTo) {
      where.dateCreation = Between(new Date(dateFrom), new Date(dateTo));
    } else if (dateFrom) {
      where.dateCreation = Between(new Date(dateFrom), new Date('9999-12-31'));
    } else if (dateTo) {
      where.dateCreation = Between(new Date('1970-01-01'), new Date(dateTo));
    }

    if (search) {
      const results = await this.commissionRepo
        .createQueryBuilder('ce')
        .where('ce.reference LIKE :search OR ce.objet LIKE :search', {
          search: `%${search}%`,
        })
        .andWhere(statut ? 'ce.statut = :statut' : '1=1', statut ? { statut } : {})
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return new PaginatedResponseDto(results[0], results[1], page, limit);
    }

    const [data, total] = await this.commissionRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<CommissionEvaluation> {
    const commission = await this.commissionRepo.findOne({
      where: { id },
      relations: ['membres'],
    });
    if (!commission) {
      throw new NotFoundException(`Commission d'évaluation avec l'ID "${id}" introuvable`);
    }
    return commission;
  }

  async create(dto: CreateCommissionEvaluationDto): Promise<CommissionEvaluation> {
    const reference = await this.generateReference();
    const commission = this.commissionRepo.create({ ...dto, reference });
    const saved = await this.commissionRepo.save(commission);
    this.emit(COMMISSION_EVENTS.EVALUATION_CREATED, {
      commissionId: saved.id,
      reference: saved.reference,
      objet: saved.objet,
      presidentId: saved.presidentId,
      createdAt: saved.createdAt,
    });
    return saved;
  }

  async update(id: string, dto: UpdateCommissionEvaluationDto): Promise<CommissionEvaluation> {
    const commission = await this.findOne(id);
    Object.assign(commission, dto);
    return this.commissionRepo.save(commission);
  }

  async remove(id: string): Promise<void> {
    const commission = await this.findOne(id);
    await this.commissionRepo.remove(commission);
  }

  async changeStatut(id: string, dto: ChangeStatutEvaluationDto): Promise<CommissionEvaluation> {
    const commission = await this.findOne(id);
    commission.statut = dto.statut;
    const saved = await this.commissionRepo.save(commission);
    this.emit(COMMISSION_EVENTS.EVALUATION_STATUT_CHANGED, {
      commissionId: id,
      reference: commission.reference,
      statut: dto.statut,
      changedAt: new Date().toISOString(),
    });
    return saved;
  }

  async findMembres(id: string): Promise<MembreEvaluation[]> {
    await this.findOne(id);
    return this.membreRepo.find({ where: { commissionId: id } });
  }

  async addMembre(id: string, dto: AddMembreEvaluationDto): Promise<MembreEvaluation> {
    await this.findOne(id);
    const existing = await this.membreRepo.findOne({
      where: { commissionId: id, userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('Ce membre fait déjà partie de cette commission');
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
      throw new NotFoundException(`Membre avec l'ID "${membreId}" introuvable dans cette commission`);
    }
    await this.membreRepo.remove(membre);
  }

  async updateMembre(id: string, membreId: string, dto: any): Promise<any> {
    await this.findOne(id);
    const membre = await this.membreRepo.findOne({
      where: { id: membreId, commissionId: id },
    });
    if (!membre) {
      throw new NotFoundException(`Membre avec l'ID "${membreId}" introuvable dans cette commission`);
    }
    Object.assign(membre, dto);
    return this.membreRepo.save(membre);
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
      doc.fontSize(18).font('Helvetica-Bold').text("COMMISSION D'EVALUATION", { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(commission.reference, { align: 'center' });
      doc.moveDown();

      // Commission info
      doc.fontSize(12).font('Helvetica');
      doc.text(`Objet: ${commission.objet}`);
      doc.text(`Date de creation: ${commission.dateCreation}`);
      doc.text(`Date de reunion: ${commission.dateReunion || 'Non programmee'}`);
      doc.text(`Statut: ${commission.statut}`);
      if (commission.observations) {
        doc.text(`Observations: ${commission.observations}`);
      }
      doc.moveDown();

      // Members section
      doc.fontSize(14).font('Helvetica-Bold').text('MEMBRES DE LA COMMISSION', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(11).font('Helvetica');
      membres.forEach((m, i) => {
        doc.text(`${i + 1}. ${m.prenom} ${m.nom} - ${m.role}`);
      });

      doc.moveDown();
      doc.fontSize(10).fillColor('gray').text(`Genere le: ${new Date().toLocaleString('fr-FR')}`, { align: 'right' });

      doc.end();
    });

    const fileName = `commission-evaluation-${commission.reference}.pdf`;
    return { buffer, fileName };
  }
}
