import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { RoleMembreEvaluation } from '../../common/enums/role-membre.enum';

export class AddMembreEvaluationDto {
  @ApiProperty({
    description: 'UUID de l\'utilisateur',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Nom du membre', example: 'Bensalem' })
  @IsNotEmpty()
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Prénom du membre', example: 'Karim' })
  @IsNotEmpty()
  @IsString()
  prenom: string;

  @ApiProperty({
    description: 'Rôle au sein de la commission',
    enum: RoleMembreEvaluation,
    example: RoleMembreEvaluation.MEMBRE,
  })
  @IsNotEmpty()
  @IsEnum(RoleMembreEvaluation)
  role: RoleMembreEvaluation;

  @ApiPropertyOptional({
    description: 'Date de nomination (ISO 8601)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  dateNomination?: string;
}
