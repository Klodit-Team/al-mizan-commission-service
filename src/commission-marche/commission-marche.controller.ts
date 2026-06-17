import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CommissionMarcheService } from './commission-marche.service';
import { CreateCommissionMarcheDto } from './dto/create-commission-marche.dto';
import { UpdateCommissionMarcheDto } from './dto/update-commission-marche.dto';
import { AddMembreMarcheDto } from './dto/add-membre-marche.dto';
import { UpdateMembreMarcheDto } from './dto/update-membre-marche.dto';
import { ChangeStatutMarcheDto } from './dto/change-statut-marche.dto';
import { DeliberationDto } from './dto/deliberation.dto';
import { AttributionDto } from './dto/attribution.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { GatewayGuard } from '../common/guards/gateway.guard';
import { CommissionMarche } from './entities/commission-marche.entity';
import { MembreMarche } from './entities/membre-marche.entity';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';

@ApiTags('commission-marche')
@ApiHeader({
  name: 'x-user-id',
  required: true,
  description: "ID utilisateur injecté par l'API Gateway",
})
@ApiHeader({
  name: 'x-user-roles',
  required: false,
  description: "Rôles utilisateur injectés par l'API Gateway",
})
@UseGuards(GatewayGuard)
@Controller('api/v1/commissions-marche')
export class CommissionMarcheController {
  constructor(private readonly service: CommissionMarcheService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lister toutes les commissions de marché (avec pagination et filtres)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Éléments par page',
  })
  @ApiQuery({
    name: 'statut',
    required: false,
    enum: ['EN_COURS', 'DELIBERATION', 'ATTRIBUEE', 'ANNULEE', 'INFRUCTUEUSE'],
    description: 'Filtrer par statut',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Date de début (ISO 8601)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Date de fin (ISO 8601)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Recherche par référence ou intitulé',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des commissions de marché',
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CommissionMarche>> {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle commission de marché' })
  @ApiResponse({
    status: 201,
    description: 'Commission de marché créée avec succès',
    type: CommissionMarche,
  })
  @ApiResponse({ status: 400, description: 'Données de validation invalides' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  create(@Body() dto: CreateCommissionMarcheDto): Promise<CommissionMarche> {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une commission de marché par son ID' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({
    status: 200,
    description: 'Commission trouvée',
    type: CommissionMarche,
  })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CommissionMarche> {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une commission de marché' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({
    status: 200,
    description: 'Commission mise à jour',
    type: CommissionMarche,
  })
  @ApiResponse({ status: 400, description: 'Données de validation invalides' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommissionMarcheDto,
  ): Promise<CommissionMarche> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une commission de marché' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({ status: 204, description: 'Commission supprimée' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }

  @Patch(':id/statut')
  @ApiOperation({ summary: "Changer le statut d'une commission de marché" })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({
    status: 200,
    description: 'Statut mis à jour',
    type: CommissionMarche,
  })
  @ApiResponse({ status: 400, description: 'Statut invalide' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  changeStatut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatutMarcheDto,
  ): Promise<CommissionMarche> {
    return this.service.changeStatut(id, dto);
  }

  @Get(':id/membres')
  @ApiOperation({ summary: "Lister les membres d'une commission de marché" })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({
    status: 200,
    description: 'Liste des membres',
    type: [MembreMarche],
  })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  findMembres(@Param('id', ParseUUIDPipe) id: string): Promise<MembreMarche[]> {
    return this.service.findMembres(id);
  }

  @Post(':id/membres')
  @ApiOperation({ summary: 'Ajouter un membre à une commission de marché' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({
    status: 201,
    description: 'Membre ajouté avec succès',
    type: MembreMarche,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({
    status: 409,
    description: 'Ce membre est déjà dans la commission',
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  addMembre(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMembreMarcheDto,
  ): Promise<MembreMarche> {
    return this.service.addMembre(id, dto);
  }

  @Put(':id/membres/:membreId')
  @ApiOperation({ summary: "Modifier un membre d'une commission de marché" })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiParam({ name: 'membreId', description: 'UUID du membre', type: String })
  @ApiResponse({
    status: 200,
    description: 'Membre mis à jour',
    type: MembreMarche,
  })
  @ApiResponse({ status: 404, description: 'Commission ou membre introuvable' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  updateMembre(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('membreId', ParseUUIDPipe) membreId: string,
    @Body() dto: UpdateMembreMarcheDto,
  ): Promise<MembreMarche> {
    return this.service.updateMembre(id, membreId, dto);
  }

  @Delete(':id/membres/:membreId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Retirer un membre d'une commission de marché" })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiParam({ name: 'membreId', description: 'UUID du membre', type: String })
  @ApiResponse({ status: 204, description: 'Membre retiré' })
  @ApiResponse({ status: 404, description: 'Commission ou membre introuvable' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  removeMembre(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('membreId', ParseUUIDPipe) membreId: string,
  ): Promise<void> {
    return this.service.removeMembre(id, membreId);
  }

  @Post(':id/deliberation')
  @ApiOperation({
    summary: "Enregistrer le PV de délibération d'une commission de marché",
  })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({
    status: 201,
    description: 'PV de délibération enregistré',
    type: CommissionMarche,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  setDeliberation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeliberationDto,
  ): Promise<CommissionMarche> {
    return this.service.setDeliberation(id, dto);
  }

  @Get(':id/deliberation')
  @ApiOperation({
    summary: "Consulter le PV de délibération d'une commission de marché",
  })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({ status: 200, description: 'PV de délibération' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  getDeliberation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ pvDeliberation: string | null; commissionId: string }> {
    return this.service.getDeliberation(id);
  }

  @Patch(':id/attribution')
  @ApiOperation({ summary: 'Attribuer le marché à un soumissionnaire' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({
    status: 200,
    description: 'Marché attribué avec succès',
    type: CommissionMarche,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  attribuerMarche(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttributionDto,
  ): Promise<CommissionMarche> {
    return this.service.attribuerMarche(id, dto);
  }

  @Get(':id/export-pdf')
  @ApiOperation({ summary: 'Exporter la commission de marché en PDF' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({ status: 200, description: 'Fichier PDF téléchargé' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé — header X-User-Id manquant ou session invalide',
  })
  async exportPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, fileName } = await this.service.exportPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }
}
