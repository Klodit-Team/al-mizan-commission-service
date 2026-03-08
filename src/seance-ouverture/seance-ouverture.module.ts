import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeanceOuverture } from './entities/seance-ouverture.entity';
import { ResultatOuverture } from './entities/resultat-ouverture.entity';
import { SeanceOuvertureController } from './seance-ouverture.controller';
import { SeanceOuvertureService } from './seance-ouverture.service';
import { RabbitMQModule } from '../common/messaging/rabbitmq.module';
import { MinioService } from '../common/services/minio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SeanceOuverture, ResultatOuverture]),
    RabbitMQModule,
  ],
  controllers: [SeanceOuvertureController],
  providers: [SeanceOuvertureService, MinioService],
  exports: [SeanceOuvertureService],
})
export class SeanceOuvertureModule {}
