import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SeanceOuverture } from './seance-ouverture.entity';

@Entity('resultats_ouverture')
export class ResultatOuverture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  seanceId: string;

  @ManyToOne(() => SeanceOuverture, (seance) => seance.resultats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'seanceId' })
  seance: SeanceOuverture;

  @Column({ type: 'uuid' })
  soumissionId: string;

  @Column({ default: false })
  pliRecu: boolean;

  @Column({ default: false })
  pliConforme: boolean;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @CreateDateColumn()
  createdAt: Date;
}
