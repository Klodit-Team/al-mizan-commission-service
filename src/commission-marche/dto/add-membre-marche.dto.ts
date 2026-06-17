import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { RoleMembreMarche } from '../../common/enums/role-membre.enum';

export class AddMembreMarcheDto {
  @ApiProperty({
    description: "UUID de l'utilisateur",
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Nom du membre', example: 'Hadj' })
  @IsNotEmpty()
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Prénom du membre', example: 'Aissa' })
  @IsNotEmpty()
  @IsString()
  prenom: string;

  @ApiPropertyOptional({
    description: 'Fonction du membre',
    example: 'Directeur Financier',
  })
  @IsOptional()
  @IsString()
  fonction?: string;

  @ApiProperty({
    description: 'Rôle au sein de la commission de marché',
    enum: RoleMembreMarche,
    example: RoleMembreMarche.MEMBRE,
  })
  @IsNotEmpty()
  @IsEnum(RoleMembreMarche)
  role: RoleMembreMarche;

  @ApiPropertyOptional({
    description: 'Date de nomination (ISO 8601)',
    example: '2024-02-01',
  })
  @IsOptional()
  @IsDateString()
  dateNomination?: string;
}
