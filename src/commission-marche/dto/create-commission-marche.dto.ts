import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutMarche } from '../../common/enums/statut-marche.enum';
import { TypeMarche } from '../../common/enums/type-marche.enum';

export class CreateCommissionMarcheDto {
  @ApiProperty({
    description: 'Intitulé du marché',
    example: 'Fourniture de matériel informatique — Lot 1',
  })
  @IsNotEmpty()
  @IsString()
  intitule: string;

  @ApiProperty({
    description: 'Type de marché',
    enum: TypeMarche,
    example: TypeMarche.FOURNITURES,
  })
  @IsNotEmpty()
  @IsEnum(TypeMarche)
  typeMarche: TypeMarche;

  @ApiPropertyOptional({
    description: 'Montant estimé du marché (en DA)',
    example: 5000000.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montantEstime?: number;

  @ApiPropertyOptional({
    description: "Date d'ouverture des offres (ISO 8601)",
    example: '2024-03-01',
  })
  @IsOptional()
  @IsDateString()
  dateOuvertureOffres?: string;

  @ApiPropertyOptional({
    description: 'Date des délibérations (ISO 8601)',
    example: '2024-03-15',
  })
  @IsOptional()
  @IsDateString()
  dateDeliberations?: string;

  @ApiPropertyOptional({
    description: 'Statut initial de la commission',
    enum: StatutMarche,
    example: StatutMarche.EN_COURS,
    default: StatutMarche.EN_COURS,
  })
  @IsOptional()
  @IsEnum(StatutMarche)
  statut?: StatutMarche;

  @ApiProperty({
    description: 'UUID du président de la commission de marché',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  presidentId: string;

  @ApiPropertyOptional({
    description: 'Nombre de soumissionnaires',
    example: 5,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  soumissionnairesCount?: number;
}
