import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoleMembreEvaluation } from '../../common/enums/role-membre.enum';
import { CommissionEvaluation } from './commission-evaluation.entity';

@Entity('membres_evaluation')
export class MembreEvaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CommissionEvaluation, (commission) => commission.membres, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commissionId' })
  commission: CommissionEvaluation;

  @Column({ type: 'uuid' })
  commissionId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({
    type: 'enum',
    enum: RoleMembreEvaluation,
    default: RoleMembreEvaluation.MEMBRE,
  })
  role: RoleMembreEvaluation;

  @Column({ type: 'date', nullable: true })
  dateNomination: Date;

  @Column({ default: true })
  actif: boolean;
}
