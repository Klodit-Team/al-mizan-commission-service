import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatutEvaluation } from '../../common/enums/statut-evaluation.enum';

export class ChangeStatutEvaluationDto {
  @ApiProperty({
    description: 'Nouveau statut de la commission',
    enum: StatutEvaluation,
    example: StatutEvaluation.ACTIVE,
  })
  @IsNotEmpty()
  @IsEnum(StatutEvaluation)
  statut: StatutEvaluation;
}
