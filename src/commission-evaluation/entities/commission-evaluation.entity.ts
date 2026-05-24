import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutEvaluation } from '../../common/enums/statut-evaluation.enum';
import { MembreEvaluation } from './membre-evaluation.entity';

@Entity('commissions_evaluation')
export class CommissionEvaluation {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  reference: string;

  @ApiProperty()
  @Column()
  objet: string;

  @ApiProperty()
  @Column({ type: 'date' })
  dateCreation: Date;

  @ApiPropertyOptional()
  @Column({ type: 'date', nullable: true })
  dateReunion: Date;

  @ApiProperty({ enum: StatutEvaluation })
  @Column({
    type: 'enum',
    enum: StatutEvaluation,
    default: StatutEvaluation.BROUILLON,
  })
  statut: StatutEvaluation;

  @ApiProperty()
  @Column({ type: 'uuid' })
  presidentId: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiProperty({ type: () => [MembreEvaluation] })
  @OneToMany(() => MembreEvaluation, (membre) => membre.commission, {
    cascade: true,
    eager: false,
  })
  membres: MembreEvaluation[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}