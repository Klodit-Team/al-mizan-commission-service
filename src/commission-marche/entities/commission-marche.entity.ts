import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutMarche } from '../../common/enums/statut-marche.enum';
import { TypeMarche } from '../../common/enums/type-marche.enum';
import { MembreMarche } from './membre-marche.entity';

@Entity('commissions_marche')
export class CommissionMarche {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  reference: string;

  @ApiProperty()
  @Column()
  intitule: string;

  @ApiProperty({ enum: TypeMarche })
  @Column({
    type: 'enum',
    enum: TypeMarche,
  })
  typeMarche: TypeMarche;

  @ApiPropertyOptional()
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  montantEstime: number;

  @ApiPropertyOptional()
  @Column({ type: 'date', nullable: true })
  dateOuvertureOffres: Date;

  @ApiPropertyOptional()
  @Column({ type: 'date', nullable: true })
  dateDeliberations: Date;

  @ApiProperty({ enum: StatutMarche })
  @Column({
    type: 'enum',
    enum: StatutMarche,
    default: StatutMarche.EN_COURS,
  })
  statut: StatutMarche;

  @ApiProperty()
  @Column({ type: 'uuid' })
  presidentId: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  pvDeliberation: string;

  @ApiProperty()
  @Column({ default: 0 })
  soumissionnairesCount: number;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  soumissionnairesRetenu: string;

  @ApiProperty({ type: () => [MembreMarche] })
  @OneToMany(() => MembreMarche, (membre) => membre.commission, {
    cascade: true,
    eager: false,
  })
  membres: MembreMarche[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}