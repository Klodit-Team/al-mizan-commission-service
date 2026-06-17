import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsString, IsOptional } from 'class-validator';

export class CreateResultatDto {
  @ApiProperty({ description: 'ID de la soumission', example: 'uuid' })
  @IsUUID()
  soumissionId: string;

  @ApiProperty({ description: 'Pli reçu ?', default: false })
  @IsBoolean()
  pliRecu: boolean;

  @ApiProperty({ description: 'Pli conforme ?', default: false })
  @IsBoolean()
  pliConforme: boolean;

  @ApiPropertyOptional({
    description: 'Observations',
    example: 'Documents complets',
  })
  @IsString()
  @IsOptional()
  observations?: string;
}
