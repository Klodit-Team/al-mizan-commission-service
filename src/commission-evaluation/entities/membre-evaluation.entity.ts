import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleMembreEvaluation } from '../../common/enums/role-membre.enum';
import { CommissionEvaluation } from './commission-evaluation.entity';

@Entity('membres_evaluation')
export class MembreEvaluation {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // We omit @ApiProperty here to prevent circular dependency issues in Swagger UI
  @ManyToOne(() => CommissionEvaluation, (commission) => commission.membres, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commissionId' })
  commission: CommissionEvaluation;

  @ApiProperty()
  @Column({ type: 'uuid' })
  commissionId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty()
  @Column()
  nom: string;

  @ApiProperty()
  @Column()
  prenom: string;

  @ApiProperty({ enum: RoleMembreEvaluation })
  @Column({
    type: 'enum',
    enum: RoleMembreEvaluation,
    default: RoleMembreEvaluation.MEMBRE,
  })
  role: RoleMembreEvaluation;

  @ApiPropertyOptional()
  @Column({ type: 'date', nullable: true })
  dateNomination: Date;

  @ApiProperty()
  @Column({ default: true })
  actif: boolean;
}