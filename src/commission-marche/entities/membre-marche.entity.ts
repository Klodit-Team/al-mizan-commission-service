import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleMembreMarche } from '../../common/enums/role-membre.enum';
import { CommissionMarche } from './commission-marche.entity';

@Entity('membres_marche')
export class MembreMarche {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CommissionMarche, (commission) => commission.membres, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commissionId' })
  commission: CommissionMarche;

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

  @ApiPropertyOptional()
  @Column({ nullable: true })
  fonction: string;

  @ApiProperty({ enum: RoleMembreMarche })
  @Column({
    type: 'enum',
    enum: RoleMembreMarche,
    default: RoleMembreMarche.MEMBRE,
  })
  role: RoleMembreMarche;

  @ApiPropertyOptional()
  @Column({ type: 'date', nullable: true })
  dateNomination: Date;

  @ApiProperty()
  @Column({ default: true })
  actif: boolean;
}