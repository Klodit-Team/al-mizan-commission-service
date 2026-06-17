import { PartialType } from '@nestjs/swagger';
import { CreateCommissionEvaluationDto } from './create-commission-evaluation.dto';

export class UpdateCommissionEvaluationDto extends PartialType(
  CreateCommissionEvaluationDto,
) {}
