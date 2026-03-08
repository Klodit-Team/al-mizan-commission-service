import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionEvaluationController } from './commission-evaluation.controller';
import { CommissionEvaluationService } from './commission-evaluation.service';
import { CommissionEvaluation } from './entities/commission-evaluation.entity';
import { MembreEvaluation } from './entities/membre-evaluation.entity';
import { RabbitMQModule } from '../common/messaging/rabbitmq.module';
import { MinioService } from '../common/services/minio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommissionEvaluation, MembreEvaluation]),
    RabbitMQModule,
  ],
  controllers: [CommissionEvaluationController],
  providers: [CommissionEvaluationService, MinioService],
  exports: [CommissionEvaluationService],
})
export class CommissionEvaluationModule {}
