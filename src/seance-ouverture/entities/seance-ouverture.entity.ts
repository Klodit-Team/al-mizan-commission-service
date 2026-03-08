import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TypeSeance } from '../../common/enums/type-seance.enum';
import { StatutSeance } from '../../common/enums/statut-seance.enum';
import { CommissionEvaluation } from '../../commission-evaluation/entities/commission-evaluation.entity';
import { ResultatOuverture } from './resultat-ouverture.entity';

@Entity('seances_ouverture')
export class SeanceOuverture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  appelOffreId: string;

  @Column({ type: 'uuid' })
  commissionId: string;

  @ManyToOne(() => CommissionEvaluation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commissionId' })
  commission: CommissionEvaluation;

  @Column({
    type: 'enum',
    enum: TypeSeance,
  })
  type: TypeSeance;

  @Column({ type: 'datetime' })
  dateSeance: Date;

  @Column({ length: 255 })
  lieu: string;

  @Column({
    type: 'enum',
    enum: StatutSeance,
    default: StatutSeance.PROGRAMMEE,
  })
  statut: StatutSeance;

  @Column({ default: true })
  isPublique: boolean;

  @Column({ length: 500, nullable: true })
  pvUrl: string;

  @OneToMany(() => ResultatOuverture, (resultat) => resultat.seance, {
    cascade: true,
  })
  resultats: ResultatOuverture[];

  @CreateDateColumn()
  createdAt: Date;
}
