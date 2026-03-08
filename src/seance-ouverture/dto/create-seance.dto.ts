import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { TypeSeance } from '../../common/enums/type-seance.enum';

export class CreateSeanceDto {
  @ApiProperty({ description: 'ID de l\'appel d\'offres', example: 'uuid' })
  @IsUUID()
  appelOffreId: string;

  @ApiProperty({ description: 'ID de la commission d\'évaluation', example: 'uuid' })
  @IsUUID()
  commissionId: string;

  @ApiProperty({ enum: TypeSeance, description: 'Type de séance' })
  @IsEnum(TypeSeance)
  type: TypeSeance;

  @ApiProperty({ description: 'Date et heure de la séance', example: '2024-03-15T10:00:00Z' })
  @IsDateString()
  dateSeance: string;

  @ApiProperty({ description: 'Lieu de la séance', example: 'Salle A - Ministère' })
  @IsString()
  @MaxLength(255)
  lieu: string;

  @ApiProperty({ description: 'Séance publique ?', default: true })
  @IsBoolean()
  @IsOptional()
  isPublique?: boolean;
}
