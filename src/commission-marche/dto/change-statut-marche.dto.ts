import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatutMarche } from '../../common/enums/statut-marche.enum';

export class ChangeStatutMarcheDto {
  @ApiProperty({
    description: 'Nouveau statut de la commission de marché',
    enum: StatutMarche,
    example: StatutMarche.DELIBERATION,
  })
  @IsNotEmpty()
  @IsEnum(StatutMarche)
  statut: StatutMarche;
}
