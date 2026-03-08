import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class UpdateResultatDto {
  @ApiPropertyOptional({ description: 'Pli reçu ?' })
  @IsBoolean()
  @IsOptional()
  pliRecu?: boolean;

  @ApiPropertyOptional({ description: 'Pli conforme ?' })
  @IsBoolean()
  @IsOptional()
  pliConforme?: boolean;

  @ApiPropertyOptional({ description: 'Observations' })
  @IsString()
  @IsOptional()
  observations?: string;
}
