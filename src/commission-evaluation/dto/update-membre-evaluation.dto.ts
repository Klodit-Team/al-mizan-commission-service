import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { RoleMembreEvaluation } from '../../common/enums/role-membre.enum';

export class UpdateMembreEvaluationDto {
  @ApiPropertyOptional({ description: 'Nom du membre', example: 'Bensalem' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({ description: 'Prénom du membre', example: 'Karim' })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional({
    description: 'Rôle au sein de la commission',
    enum: RoleMembreEvaluation,
    example: RoleMembreEvaluation.MEMBRE,
  })
  @IsOptional()
  @IsEnum(RoleMembreEvaluation)
  role?: RoleMembreEvaluation;

  @ApiPropertyOptional({
    description: 'Date de nomination (ISO 8601)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  dateNomination?: string;

  @ApiPropertyOptional({
    description: 'Membre actif',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
