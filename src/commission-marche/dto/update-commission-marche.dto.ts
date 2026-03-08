import { PartialType } from '@nestjs/swagger';
import { CreateCommissionMarcheDto } from './create-commission-marche.dto';

export class UpdateCommissionMarcheDto extends PartialType(CreateCommissionMarcheDto) {}
