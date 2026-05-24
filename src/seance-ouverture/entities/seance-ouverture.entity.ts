import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeSeance } from '../../common/enums/type-seance.enum';
import { StatutSeance } from '../../common/enums/statut-seance.enum';
import { CommissionEvaluation } from '../../commission-evaluation/entities/commission-evaluation.entity';
import { ResultatOuverture } from './resultat-ouverture.entity';

@Entity('seances_ouverture')
export class SeanceOuverture {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  appelOffreId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  commissionId: string;

  // Omitted from Swagger to avoid circular dependencies
  @ManyToOne(() => CommissionEvaluation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commissionId' })
  commission: CommissionEvaluation;

  @ApiProperty({ enum: TypeSeance })
  @Column({
    type: 'enum',
    enum: TypeSeance,
  })
  type: TypeSeance;

  @ApiProperty()
  @Column({ type: 'datetime' })
  dateSeance: Date;

  @ApiProperty()
  @Column({ length: 255 })
  lieu: string;

  @ApiProperty({ enum: StatutSeance })
  @Column({
    type: 'enum',
    enum: StatutSeance,
    default: StatutSeance.PROGRAMMEE,
  })
  statut: StatutSeance;

  @ApiProperty()
  @Column({ default: true })
  isPublique: boolean;

  @ApiPropertyOptional()
  @Column({ length: 500, nullable: true })
  pvUrl: string;

  @ApiProperty({ type: () => [ResultatOuverture] })
  @OneToMany(() => ResultatOuverture, (resultat) => resultat.seance, {
    cascade: true,
  })
  resultats: ResultatOuverture[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}