import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { StatutMarche } from '../../common/enums/statut-marche.enum';
import { TypeMarche } from '../../common/enums/type-marche.enum';
import { MembreMarche } from './membre-marche.entity';

@Entity('commissions_marche')
export class CommissionMarche {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  intitule: string;

  @Column({
    type: 'enum',
    enum: TypeMarche,
  })
  typeMarche: TypeMarche;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  montantEstime: number;

  @Column({ type: 'date', nullable: true })
  dateOuvertureOffres: Date;

  @Column({ type: 'date', nullable: true })
  dateDeliberations: Date;

  @Column({
    type: 'enum',
    enum: StatutMarche,
    default: StatutMarche.EN_COURS,
  })
  statut: StatutMarche;

  @Column({ type: 'uuid' })
  presidentId: string;

  @Column({ type: 'text', nullable: true })
  pvDeliberation: string;

  @Column({ default: 0 })
  soumissionnairesCount: number;

  @Column({ nullable: true })
  soumissionnairesRetenu: string;

  @OneToMany(() => MembreMarche, (membre) => membre.commission, {
    cascade: true,
    eager: false,
  })
  membres: MembreMarche[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
