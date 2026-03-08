import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsDateString,
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { TypeSeance } from '../../common/enums/type-seance.enum';
import { StatutSeance } from '../../common/enums/statut-seance.enum';

export class UpdateSeanceDto {
  @ApiPropertyOptional({ enum: TypeSeance })
  @IsEnum(TypeSeance)
  @IsOptional()
  type?: TypeSeance;

  @ApiPropertyOptional({ example: '2024-03-15T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  dateSeance?: string;

  @ApiPropertyOptional({ example: 'Salle B - Wilaya' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  lieu?: string;

  @ApiPropertyOptional({ enum: StatutSeance })
  @IsEnum(StatutSeance)
  @IsOptional()
  statut?: StatutSeance;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublique?: boolean;
}
