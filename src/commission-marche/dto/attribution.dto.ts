import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AttributionDto {
  @ApiProperty({
    description: 'Nom du soumissionnaire retenu',
    example: 'SARL Tech Solutions',
  })
  @IsNotEmpty()
  @IsString()
  soumissionnairesRetenu: string;
}
