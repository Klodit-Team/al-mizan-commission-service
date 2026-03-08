import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { StatutEvaluation } from '../../common/enums/statut-evaluation.enum';
import { MembreEvaluation } from './membre-evaluation.entity';

@Entity('commissions_evaluation')
export class CommissionEvaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  objet: string;

  @Column({ type: 'date' })
  dateCreation: Date;

  @Column({ type: 'date', nullable: true })
  dateReunion: Date;

  @Column({
    type: 'enum',
    enum: StatutEvaluation,
    default: StatutEvaluation.BROUILLON,
  })
  statut: StatutEvaluation;

  @Column({ type: 'uuid' })
  presidentId: string;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @OneToMany(() => MembreEvaluation, (membre) => membre.commission, {
    cascade: true,
    eager: false,
  })
  membres: MembreEvaluation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
