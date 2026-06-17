import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeanceOuverture } from './entities/seance-ouverture.entity';
import { ResultatOuverture } from './entities/resultat-ouverture.entity';
import { CommissionEvaluation } from '../commission-evaluation/entities/commission-evaluation.entity';
import { MembreEvaluation } from '../commission-evaluation/entities/membre-evaluation.entity';
import { SeanceOuvertureController } from './seance-ouverture.controller';
import { SeanceOuvertureService } from './seance-ouverture.service';
import { RabbitMQModule } from '../common/messaging/rabbitmq.module';
import { MinioService } from '../common/services/minio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SeanceOuverture,
      ResultatOuverture,
      CommissionEvaluation,
      MembreEvaluation,
    ]),
    RabbitMQModule,
  ],
  controllers: [SeanceOuvertureController],
  providers: [SeanceOuvertureService, MinioService],
  exports: [SeanceOuvertureService],
})
export class SeanceOuvertureModule {}
