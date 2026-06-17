import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SeanceOuverture } from './seance-ouverture.entity';

@Entity('resultats_ouverture')
export class ResultatOuverture {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  seanceId: string;

  // Omitted from Swagger to avoid circular dependencies
  @ManyToOne(() => SeanceOuverture, (seance) => seance.resultats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'seanceId' })
  seance: SeanceOuverture;

  @ApiProperty()
  @Column({ type: 'uuid' })
  soumissionId: string;

  @ApiProperty()
  @Column({ default: false })
  pliRecu: boolean;

  @ApiProperty()
  @Column({ default: false })
  pliConforme: boolean;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
