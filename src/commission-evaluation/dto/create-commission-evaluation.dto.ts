import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { StatutEvaluation } from '../../common/enums/statut-evaluation.enum';

export class CreateCommissionEvaluationDto {
  @ApiProperty({
    description: "Objet de la commission d'évaluation",
    example: 'Évaluation des offres techniques - Projet SI 2024',
  })
  @IsNotEmpty()
  @IsString()
  objet: string;

  @ApiProperty({
    description: 'Date de création de la commission (ISO 8601)',
    example: '2024-01-15',
  })
  @IsNotEmpty()
  @IsDateString()
  dateCreation: string;

  @ApiPropertyOptional({
    description: 'Date de réunion prévue (ISO 8601)',
    example: '2024-02-01',
  })
  @IsOptional()
  @IsDateString()
  dateReunion?: string;

  @ApiPropertyOptional({
    description: 'Statut initial de la commission',
    enum: StatutEvaluation,
    example: StatutEvaluation.BROUILLON,
    default: StatutEvaluation.BROUILLON,
  })
  @IsOptional()
  @IsEnum(StatutEvaluation)
  statut?: StatutEvaluation;

  @ApiProperty({
    description: 'UUID du président de la commission',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  presidentId: string;

  @ApiPropertyOptional({
    description: 'Observations ou remarques sur la commission',
    example: 'Commission constituée conformément au règlement intérieur',
  })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional({
    description: "Nombre minimum de membres requis pour l'ouverture des plis",
    example: 3,
    default: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  nombreMinMembres?: number;
}
