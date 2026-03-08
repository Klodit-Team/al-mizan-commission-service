import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionMarcheController } from './commission-marche.controller';
import { CommissionMarcheService } from './commission-marche.service';
import { CommissionMarche } from './entities/commission-marche.entity';
import { MembreMarche } from './entities/membre-marche.entity';
import { RabbitMQModule } from '../common/messaging/rabbitmq.module';
import { MinioService } from '../common/services/minio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommissionMarche, MembreMarche]),
    RabbitMQModule,
  ],
  controllers: [CommissionMarcheController],
  providers: [CommissionMarcheService, MinioService],
  exports: [CommissionMarcheService],
})
export class CommissionMarcheModule {}
