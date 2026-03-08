import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionEvaluationModule } from './commission-evaluation/commission-evaluation.module';
import { CommissionMarcheModule } from './commission-marche/commission-marche.module';
import { SeanceOuvertureModule } from './seance-ouverture/seance-ouverture.module';
import { CommissionEvaluation } from './commission-evaluation/entities/commission-evaluation.entity';
import { MembreEvaluation } from './commission-evaluation/entities/membre-evaluation.entity';
import { CommissionMarche } from './commission-marche/entities/commission-marche.entity';
import { MembreMarche } from './commission-marche/entities/membre-marche.entity';
import { SeanceOuverture } from './seance-ouverture/entities/seance-ouverture.entity';
import { ResultatOuverture } from './seance-ouverture/entities/resultat-ouverture.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'commission_db'),
        entities: [
          CommissionEvaluation,
          MembreEvaluation,
          CommissionMarche,
          MembreMarche,
          SeanceOuverture,
          ResultatOuverture,
        ],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),

    CommissionEvaluationModule,
    CommissionMarcheModule,
    SeanceOuvertureModule,
  ],
})
export class AppModule {}
