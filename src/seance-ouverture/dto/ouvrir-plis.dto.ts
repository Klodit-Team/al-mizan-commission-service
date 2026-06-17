import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class OuvrirPlisDto {
  @ApiProperty({
    description: "IDs des membres effectivement présents lors de l'ouverture",
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayMinSize(1)
  membresPresentsIds: string[];
}
