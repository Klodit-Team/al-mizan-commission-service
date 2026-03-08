import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoleMembreMarche } from '../../common/enums/role-membre.enum';
import { CommissionMarche } from './commission-marche.entity';

@Entity('membres_marche')
export class MembreMarche {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CommissionMarche, (commission) => commission.membres, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commissionId' })
  commission: CommissionMarche;

  @Column({ type: 'uuid' })
  commissionId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ nullable: true })
  fonction: string;

  @Column({
    type: 'enum',
    enum: RoleMembreMarche,
    default: RoleMembreMarche.MEMBRE,
  })
  role: RoleMembreMarche;

  @Column({ type: 'date', nullable: true })
  dateNomination: Date;

  @Column({ default: true })
  actif: boolean;
}
