import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DeliberationDto {
  @ApiProperty({
    description: 'Contenu du PV de délibération',
    example:
      'La commission, après examen des offres, déclare le soumissionnaire XYZ retenu...',
  })
  @IsNotEmpty()
  @IsString()
  pvDeliberation: string;

  @ApiPropertyOptional({
    description: 'Nombre de soumissionnaires examinés',
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  soumissionnairesCount?: number;
}
