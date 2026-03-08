# Commission Service

Microservice NestJS pour la gestion des **Commissions d'Évaluation** et des **Commissions de Marché** dans le cadre du projet **Al-Mizan**.

## Architecture

Ce service fait partie de l'architecture microservices Al-Mizan et fonctionne **derrière l'API Gateway** qui gère :
- Authentification par sessions Redis (cookies HttpOnly/Secure/SameSite=Strict)
- RBAC et rate limiting
- Injection des headers `X-User-Id`, `X-User-Roles`, `X-Session-Id`

**Port**: 8007
**Base de données**: MySQL (commission_db)
**Queue RabbitMQ**: commission_events

## Stack technique

| Technologie | Version |
|---|---|
| NestJS | ^10 |
| TypeORM | ^0.3 |
| MySQL | 8.x |
| Swagger/OpenAPI | ^11 |
| RabbitMQ | 3.x |
| MinIO | latest |
| class-validator | ^0.15 |

## Prérequis

- Node.js >= 18
- MySQL >= 8.0
- RabbitMQ >= 3.x
- npm >= 9

## Installation

```bash
cd commission-service
npm install --legacy-peer-deps
```

## Configuration (.env)

```env
PORT=8007
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=commission_db
RABBITMQ_URL=amqp://guest:guest@localhost:5672
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
NODE_ENV=development
```

## Démarrage

```bash
# Créer la base de données MySQL
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS commission_db;"

# Lancer en mode développement (hot-reload)
npm run start:dev

# Build + production
npm run build && npm run start:prod
```

## Docker

```bash
# Build l'image
docker build -t commission-service .

# Lancer avec docker-compose (inclut MySQL + RabbitMQ)
docker-compose up -d
```

## Seeding (données de démonstration)

```bash
npm run seed
```

Insère 3 commissions d'évaluation et 3 commissions de marché avec leurs membres.

## Documentation API (Swagger)

**http://localhost:8007/api/docs**

> Note: L'authentification est gérée par l'API Gateway. En développement local direct, les endpoints sont accessibles sans authentification.

## Santé

```
GET /health  →  { "status": "ok", "timestamp": "..." }
```

## Endpoints

### Commission d'Évaluation — `/api/v1/commissions-evaluation`

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/` | Liste paginée (`page`, `limit`, `statut`, `dateFrom`, `dateTo`, `search`) |
| POST | `/` | Créer une commission |
| GET | `/:id` | Obtenir par ID |
| PUT | `/:id` | Modifier |
| DELETE | `/:id` | Supprimer |
| PATCH | `/:id/statut` | Changer le statut |
| GET | `/:id/membres` | Lister les membres |
| POST | `/:id/membres` | Ajouter un membre |
| DELETE | `/:id/membres/:membreId` | Retirer un membre |
| GET | `/:id/export-pdf` | Export PDF (stub) |

### Commission de Marché — `/api/v1/commissions-marche`

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/` | Liste paginée |
| POST | `/` | Créer une commission |
| GET | `/:id` | Obtenir par ID |
| PUT | `/:id` | Modifier |
| DELETE | `/:id` | Supprimer |
| PATCH | `/:id/statut` | Changer le statut |
| GET | `/:id/membres` | Lister les membres |
| POST | `/:id/membres` | Ajouter un membre |
| DELETE | `/:id/membres/:membreId` | Retirer un membre |
| POST | `/:id/deliberation` | Enregistrer le PV |
| GET | `/:id/deliberation` | Consulter le PV |
| PATCH | `/:id/attribution` | Attribuer le marché |
| GET | `/:id/export-pdf` | Export PDF (MinIO) |

### Séances d'Ouverture — `/api/v1/seances-ouverture`

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/` | Liste des séances (`commissionId` optionnel) |
| POST | `/` | Programmer une séance |
| GET | `/:id` | Obtenir une séance |
| PUT | `/:id` | Modifier une séance |
| DELETE | `/:id` | Supprimer (si PROGRAMMEE) |
| PATCH | `/:id/demarrer` | Démarrer la séance |
| PATCH | `/:id/terminer` | Terminer la séance |
| POST | `/:id/pv` | Générer le PV (upload MinIO) |
| POST | `/:id/resultats` | Ajouter un résultat |
| PUT | `/:id/resultats/:resultatId` | Modifier un résultat |
| DELETE | `/:id/resultats/:resultatId` | Supprimer un résultat |

## Événements RabbitMQ

Le service publie les événements suivants sur la queue `commission_events` :

| Événement | Déclencheur |
|---|---|
| `commission.evaluation.created` | Création d'une commission d'évaluation |
| `commission.evaluation.statut_changed` | Changement de statut |
| `commission.marche.created` | Création d'une commission de marché |
| `commission.marche.pv_generated` | Génération du PV de délibération |
| `commission.marche.attributed` | Attribution du marché |
| `commission.seance.programmee` | Programmation d'une séance d'ouverture |
| `commission.seance.demarree` | Début d'une séance |
| `commission.seance.terminee` | Fin d'une séance |
| `commission.seance.pv_generated` | Génération du PV d'ouverture |

## Références auto-générées

- Commission d'évaluation : `CE-YYYY-NNNN` (ex: `CE-2024-0001`)
- Commission de marché : `CM-YYYY-NNNN` (ex: `CM-2024-0001`)

## Format de pagination

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

## Format d'erreur

```json
{
  "statusCode": 404,
  "message": "Commission introuvable",
  "error": "NotFoundException",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/commissions-evaluation/..."
}
```

## Conformité CSL

Ce service implémente les user stories §3.2.7 du CSL Al-Mizan :
- Constituer une commission d'évaluation
- Constituer une commission des marchés
- Programmer une séance d'ouverture des plis
- Renseigner les résultats d'ouverture
- Générer le PV d'ouverture
- Dissoudre une commission
