import { DataSource } from 'typeorm';
import { CommissionEvaluation } from '../commission-evaluation/entities/commission-evaluation.entity';
import { MembreEvaluation } from '../commission-evaluation/entities/membre-evaluation.entity';
import { CommissionMarche } from '../commission-marche/entities/commission-marche.entity';
import { MembreMarche } from '../commission-marche/entities/membre-marche.entity';
import { StatutEvaluation } from '../common/enums/statut-evaluation.enum';
import { StatutMarche } from '../common/enums/statut-marche.enum';
import { RoleMembreEvaluation, RoleMembreMarche } from '../common/enums/role-membre.enum';
import { TypeMarche } from '../common/enums/type-marche.enum';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'commission_db',
  charset: 'utf8mb4',
  entities: [CommissionEvaluation, MembreEvaluation, CommissionMarche, MembreMarche],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Connexion à la base de données établie');

  const evalRepo = AppDataSource.getRepository(CommissionEvaluation);
  const membreEvalRepo = AppDataSource.getRepository(MembreEvaluation);
  const marcheRepo = AppDataSource.getRepository(CommissionMarche);
  const membreMarcheRepo = AppDataSource.getRepository(MembreMarche);

  const existingEvaluations = await evalRepo.count();
  const existingMarches = await marcheRepo.count();
  if (existingEvaluations > 0 || existingMarches > 0) {
    console.log('ℹ️ Seed skipped: commission data already exists.');
    await AppDataSource.destroy();
    return;
  }

  // ── Commissions d'évaluation ──────────────────────────────────────────────
  const evaluations = await evalRepo.save([
    evalRepo.create({
      reference: 'CE-2024-0001',
      objet: 'Évaluation des offres techniques — Système d\'information RH',
      dateCreation: new Date('2024-01-10'),
      dateReunion: new Date('2024-02-05'),
      statut: StatutEvaluation.ACTIVE,
      presidentId: '550e8400-e29b-41d4-a716-446655440001',
      observations: 'Commission constituée conformément à la réglementation en vigueur.',
    }),
    evalRepo.create({
      reference: 'CE-2024-0002',
      objet: 'Évaluation des offres — Acquisition de serveurs informatiques',
      dateCreation: new Date('2024-03-15'),
      dateReunion: new Date('2024-04-01'),
      statut: StatutEvaluation.CLOTUREE,
      presidentId: '550e8400-e29b-41d4-a716-446655440002',
      observations: 'Processus d\'évaluation clos le 05/04/2024.',
    }),
    evalRepo.create({
      reference: 'CE-2024-0003',
      objet: 'Évaluation des candidatures — Formation professionnelle lot 3',
      dateCreation: new Date('2024-06-01'),
      dateReunion: new Date('2024-06-20'),
      statut: StatutEvaluation.BROUILLON,
      presidentId: '550e8400-e29b-41d4-a716-446655440003',
    }),
  ]);

  await membreEvalRepo.save([
    membreEvalRepo.create({ commissionId: evaluations[0].id, userId: '550e8400-e29b-41d4-a716-446655440011', nom: 'Bensalem', prenom: 'Karim', role: RoleMembreEvaluation.PRESIDENT, dateNomination: new Date('2024-01-10'), actif: true }),
    membreEvalRepo.create({ commissionId: evaluations[0].id, userId: '550e8400-e29b-41d4-a716-446655440012', nom: 'Amrani', prenom: 'Fatima', role: RoleMembreEvaluation.RAPPORTEUR, dateNomination: new Date('2024-01-10'), actif: true }),
    membreEvalRepo.create({ commissionId: evaluations[0].id, userId: '550e8400-e29b-41d4-a716-446655440013', nom: 'Kaci', prenom: 'Mourad', role: RoleMembreEvaluation.MEMBRE, dateNomination: new Date('2024-01-10'), actif: true }),
    membreEvalRepo.create({ commissionId: evaluations[1].id, userId: '550e8400-e29b-41d4-a716-446655440014', nom: 'Djebbar', prenom: 'Yacine', role: RoleMembreEvaluation.PRESIDENT, dateNomination: new Date('2024-03-15'), actif: true }),
    membreEvalRepo.create({ commissionId: evaluations[1].id, userId: '550e8400-e29b-41d4-a716-446655440015', nom: 'Haouari', prenom: 'Nadia', role: RoleMembreEvaluation.MEMBRE, dateNomination: new Date('2024-03-15'), actif: true }),
    membreEvalRepo.create({ commissionId: evaluations[2].id, userId: '550e8400-e29b-41d4-a716-446655440016', nom: 'Meziane', prenom: 'Omar', role: RoleMembreEvaluation.PRESIDENT, dateNomination: new Date('2024-06-01'), actif: true }),
  ]);

  console.log('✅ 3 commissions d\'évaluation créées');

  // ── Commissions de marché ─────────────────────────────────────────────────
  const marches = await marcheRepo.save([
    marcheRepo.create({
      reference: 'CM-2024-0001',
      intitule: 'Acquisition de matériel informatique — Lot 1 : Postes de travail',
      typeMarche: TypeMarche.FOURNITURES,
      montantEstime: 12500000.00,
      dateOuvertureOffres: new Date('2024-02-10'),
      dateDeliberations: new Date('2024-02-25'),
      statut: StatutMarche.ATTRIBUEE,
      presidentId: '550e8400-e29b-41d4-a716-446655440021',
      pvDeliberation: 'Après examen des 4 offres reçues, la commission retient l\'offre de SARL TechAlgérie pour un montant de 11 800 000 DA.',
      soumissionnairesCount: 4,
      soumissionnairesRetenu: 'SARL TechAlgérie',
    }),
    marcheRepo.create({
      reference: 'CM-2024-0002',
      intitule: 'Travaux de réhabilitation du bâtiment principal — Tranche 2',
      typeMarche: TypeMarche.TRAVAUX,
      montantEstime: 45000000.00,
      dateOuvertureOffres: new Date('2024-04-15'),
      dateDeliberations: new Date('2024-05-01'),
      statut: StatutMarche.DELIBERATION,
      presidentId: '550e8400-e29b-41d4-a716-446655440022',
      soumissionnairesCount: 6,
    }),
    marcheRepo.create({
      reference: 'CM-2024-0003',
      intitule: 'Prestation de service — Formation en cybersécurité',
      typeMarche: TypeMarche.SERVICES,
      montantEstime: 3200000.00,
      dateOuvertureOffres: new Date('2024-07-01'),
      statut: StatutMarche.EN_COURS,
      presidentId: '550e8400-e29b-41d4-a716-446655440023',
    }),
  ]);

  await membreMarcheRepo.save([
    membreMarcheRepo.create({ commissionId: marches[0].id, userId: '550e8400-e29b-41d4-a716-446655440031', nom: 'Hadj', prenom: 'Aissa', fonction: 'Directeur des Achats', role: RoleMembreMarche.PRESIDENT, dateNomination: new Date('2024-02-01'), actif: true }),
    membreMarcheRepo.create({ commissionId: marches[0].id, userId: '550e8400-e29b-41d4-a716-446655440032', nom: 'Benali', prenom: 'Samir', fonction: 'Contrôleur Financier', role: RoleMembreMarche.CONTROLEUR, dateNomination: new Date('2024-02-01'), actif: true }),
    membreMarcheRepo.create({ commissionId: marches[0].id, userId: '550e8400-e29b-41d4-a716-446655440033', nom: 'Tlemcani', prenom: 'Leila', fonction: 'Responsable SI', role: RoleMembreMarche.RAPPORTEUR, dateNomination: new Date('2024-02-01'), actif: true }),
    membreMarcheRepo.create({ commissionId: marches[1].id, userId: '550e8400-e29b-41d4-a716-446655440034', nom: 'Boukhelifa', prenom: 'Rachid', fonction: 'Directeur Technique', role: RoleMembreMarche.PRESIDENT, dateNomination: new Date('2024-04-01'), actif: true }),
    membreMarcheRepo.create({ commissionId: marches[1].id, userId: '550e8400-e29b-41d4-a716-446655440035', nom: 'Saidani', prenom: 'Hafida', fonction: 'Ingénieure Génie Civil', role: RoleMembreMarche.MEMBRE, dateNomination: new Date('2024-04-01'), actif: true }),
    membreMarcheRepo.create({ commissionId: marches[2].id, userId: '550e8400-e29b-41d4-a716-446655440036', nom: 'Cherif', prenom: 'Walid', fonction: 'RSSI', role: RoleMembreMarche.PRESIDENT, dateNomination: new Date('2024-06-20'), actif: true }),
  ]);

  console.log('✅ 3 commissions de marché créées');
  console.log('🌱 Seeding terminé avec succès !');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Erreur lors du seeding :', err);
  process.exit(1);
});
