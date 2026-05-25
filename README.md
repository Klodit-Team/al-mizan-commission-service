# al-mizan-commission-service

> **Service de la Commission des Marchés** — Gestion des séances d'ouverture des plis, composition des commissions d'évaluation et génération de PV officiels pour la plateforme Al-Mizan.

---

## Table des matières

1. [Aperçu](#aperçu)
2. [Technologies](#technologies)
3. [Architecture & Réseau](#architecture--réseau)
4. [Variables d'environnement](#variables-denvironnement)
5. [API REST](#api-rest)
6. [Messagerie RabbitMQ](#messagerie-rabbitmq)
7. [Commandes utiles](#commandes-utiles)
8. [Docker](#docker)

---

## Aperçu

`al-mizan-commission-service` gère les processus de commission dans le cycle de vie d'un appel d'offres :

- **Séance d'ouverture des plis** : enregistrement de la séance, présence des membres, PV d'ouverture.
- **Commission d'évaluation** : composition de la commission, affectation des membres évaluateurs.
- **Commission de marché** : validation du marché final après attribution.
- **Génération de rapports PDF** : procès-verbaux officiels (PV d'ouverture, rapport de commission) via PDFKit, stockés sur MinIO.

---

## Technologies

| Technologie       | Version  | Rôle                                              |
|-------------------|----------|---------------------------------------------------|
| Node.js           | 20 LTS   | Runtime                                           |
| TypeScript        | ^5.1     | Langage                                           |
| NestJS            | ^10.0    | Framework (modules, DI, microservices)            |
| TypeORM           | ^0.3.28  | ORM MySQL (entities, migrations)                  |
| MySQL             | 8.x      | Base de données principale (`commission_db`)      |
| MinIO (SDK)       | ^8.0     | Stockage des PV et rapports PDF                   |
| PDFKit            | ^0.17    | Génération de documents PDF                       |
| amqplib           | ^0.10    | Client RabbitMQ                                   |
| amqp-connection-manager | ^5.0 | Reconnexion automatique RabbitMQ              |
| class-validator   | ^0.15    | Validation des DTOs                               |
| @nestjs/swagger   | ^7.3     | Documentation OpenAPI                             |
| Jest              | ^29.5    | Tests unitaires & e2e                             |

---

## Architecture & Réseau

```
API Gateway (:3000) ──► commission-service (:8007)
                                │
                                ├── MySQL    (mysql:3306 → commission_db)
                                ├── MinIO    (minio:9000 — PV PDF)
                                └── RabbitMQ (rabbitmq:5672)
```

- **Port exposé** : `8007`
- **Réseau Docker** : `al-mizan-network`
- **Nom du conteneur** : `commission-service`
- **Swagger UI** : `http://localhost:8007/api`

> ⚠️ `NODE_ENV=development` est requis pour que TypeORM synchronise automatiquement le schéma. Ne pas utiliser en production (utiliser des migrations versionnées).

---

## Variables d'environnement

```env
PORT=8007
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=commission_db

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# MinIO (S3-compatible)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

> ⚠️ En production, remplacer `localhost` par les noms de conteneurs : `mysql`, `rabbitmq`, `minio`.

---

## API REST

Base URL (via Gateway) : `http://localhost:3000/commission`  
Base URL (directe) : `http://localhost:8007`  
Swagger : `http://localhost:8007/api`

### Séance d'Ouverture

| Méthode  | Endpoint                                   | Auth | Description                                     |
|----------|--------------------------------------------|------|-------------------------------------------------|
| `POST`   | `/seance-ouverture`                        | Oui  | Créer une séance d'ouverture pour un AO         |
| `GET`    | `/seance-ouverture/:id`                    | Oui  | Détail d'une séance                             |
| `PATCH`  | `/seance-ouverture/:id/cloturer`           | Oui  | Clôturer la séance                              |
| `POST`   | `/seance-ouverture/:id/pv`                 | Oui  | Générer le PV PDF d'ouverture                   |

### Commission d'Évaluation

| Méthode  | Endpoint                                      | Auth | Description                                |
|----------|-----------------------------------------------|------|--------------------------------------------|
| `POST`   | `/commission-evaluation`                      | Oui  | Créer une commission d'évaluation          |
| `GET`    | `/commission-evaluation/:id`                  | Oui  | Détail de la commission                    |
| `POST`   | `/commission-evaluation/:id/membres`          | Oui  | Ajouter un membre évaluateur               |
| `DELETE` | `/commission-evaluation/:id/membres/:userId`  | Oui  | Retirer un membre                          |

### Commission de Marché

| Méthode  | Endpoint                                   | Auth | Description                                       |
|----------|--------------------------------------------|------|---------------------------------------------------|
| `POST`   | `/commission-marche`                       | Oui  | Créer une commission de marché                    |
| `GET`    | `/commission-marche/:id`                   | Oui  | Détail de la commission de marché                 |
| `POST`   | `/commission-marche/:id/rapport`           | Oui  | Générer le rapport PDF de commission de marché    |

---

## Messagerie RabbitMQ

**Exchange** : `al-mizan.events` (type: `topic`, durable: `true`)

### Événements publiés

| Routing Key                        | Déclencheur                         | Consommateurs                    |
|------------------------------------|-------------------------------------|----------------------------------|
| `commission.pv.genere`             | PV d'ouverture généré               | audit-service, notification      |
| `commission.evaluation.cloturee`   | Commission d'évaluation clôturée    | evaluation-service, audit        |
| `commission.marche.approuve`       | Commission de marché approuvée      | notification-service, audit      |

### Événements consommés

| Routing Key             | Source               | Action réalisée                                        |
|-------------------------|----------------------|--------------------------------------------------------|
| `ao.status_changed`     | appel-offres-service | Déclenchement automatique de la commission (OUVERTURE_PLIS) |
| `soumission.evaluee`    | soumission-service   | Réception des notes d'évaluation                       |

---

## Commandes utiles

### Développement local

```bash
npm install
npm run start:dev       # Hot-reload NestJS
npm run build           # Compilation TypeScript
npm run start:prod      # Production
```

### Base de données (TypeORM)

```bash
# Seeder les données initiales
npm run seed
```

> ⚠️ TypeORM est configuré en mode `synchronize: true` en développement. En production, utiliser des migrations TypeORM versionnées.

### Tests

```bash
npm test
npm run test:e2e
npm run test:cov
```

---

## Docker

### Build de l'image

```bash
docker build -t al-mizan-commission-service .
```

### Notes importantes sur le Dockerfile

- Image de base : `node:20-alpine`
- **`openssl` installé** pour la compatibilité NestJS/Alpine.
- Au démarrage : `node dist/main` (TypeORM synchronise le schéma automatiquement si `NODE_ENV=development`).

### Déploiement via docker-compose

```bash
docker-compose up -d commission-service
docker-compose logs -f commission-service
```

---

*Maintenu par l'équipe Al-Mizan — voir `al-mizan-deployments` pour la configuration de déploiement complète.*
