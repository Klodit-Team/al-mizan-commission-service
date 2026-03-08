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
import { CommissionEvaluationService } from './commission-evaluation.service';
import { CreateCommissionEvaluationDto } from './dto/create-commission-evaluation.dto';
import { UpdateCommissionEvaluationDto } from './dto/update-commission-evaluation.dto';
import { AddMembreEvaluationDto } from './dto/add-membre-evaluation.dto';
import { UpdateMembreEvaluationDto } from './dto/update-membre-evaluation.dto';
import { ChangeStatutEvaluationDto } from './dto/change-statut-evaluation.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { GatewayGuard } from '../common/guards/gateway.guard';

@ApiTags('commission-evaluation')
@ApiHeader({ name: 'x-user-id', required: true, description: 'ID utilisateur injecté par l\'API Gateway' })
@ApiHeader({ name: 'x-user-roles', required: false, description: 'Rôles utilisateur injectés par l\'API Gateway' })
@UseGuards(GatewayGuard)
@Controller('api/v1/commissions-evaluation')
export class CommissionEvaluationController {
  constructor(private readonly service: CommissionEvaluationService) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les commissions d\'évaluation (avec pagination et filtres)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Éléments par page' })
  @ApiQuery({ name: 'statut', required: false, enum: ['BROUILLON', 'ACTIVE', 'CLOTUREE', 'ANNULEE'], description: 'Filtrer par statut' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Date de début (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Date de fin (ISO 8601)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche par référence ou objet' })
  @ApiResponse({ status: 200, description: 'Liste paginée des commissions d\'évaluation' })
  @ApiResponse({ status: 401, description: 'Non autorisé — header X-User-Id manquant ou session invalide' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle commission d\'évaluation' })
  @ApiResponse({ status: 201, description: 'Commission créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données de validation invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé — header X-User-Id manquant ou session invalide' })
  create(@Body() dto: CreateCommissionEvaluationDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une commission d\'évaluation par son ID' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({ status: 200, description: 'Commission trouvée' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({ status: 401, description: 'Non autorisé — header X-User-Id manquant ou session invalide' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une commission d\'évaluation' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({ status: 200, description: 'Commission mise à jour' })
  @ApiResponse({ status: 400, description: 'Données de validation invalides' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({ status: 401, description: 'Non autorisé — header X-User-Id manquant ou session invalide' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommissionEvaluationDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une commission d\'évaluation' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({ status: 204, description: 'Commission supprimée' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({ status: 401, description: 'Non autorisé — header X-User-Id manquant ou session invalide' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/statut')
  @ApiOperation({ summary: 'Changer le statut d\'une commission d\'évaluation' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  @ApiResponse({ status: 400, description: 'Statut invalide' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({ status: 401, description: 'Non autorisé — header X-User-Id manquant ou session invalide' })
  changeStatut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatutEvaluationDto,
  ) {
    return this.service.changeStatut(id, dto);
  }

  @Get(':id/membres')
  @ApiOperation({ summary: 'Lister les membres d\'une commission d\'évaluation' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({ status: 200, description: 'Liste des membres' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({ status: 401, description: 'Non autorisé — header X-User-Id manquant ou session invalide' })
  findMembres(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findMembres(id);
  }

  @Post(':id/membres')
  @ApiOperation({ summary: 'Ajouter un membre à une commission d\'évaluation' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({ status: 201, description: 'Membre ajouté avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({ status: 409, description: 'Ce membre est déjà dans la commission' })
  @ApiResponse({ status: 401, description: 'Non autorisé — header X-User-Id manquant ou session invalide' })
  addMembre(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMembreEvaluationDto,
  ) {
    return this.service.addMembre(id, dto);
  }

  @Put(':id/membres/:membreId')
  @ApiOperation({ summary: 'Modifier un membre d\'une commission d\'évaluation' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiParam({ name: 'membreId', description: 'UUID du membre', type: String })
  @ApiResponse({ status: 200, description: 'Membre mis à jour' })
  @ApiResponse({ status: 404, description: 'Commission ou membre introuvable' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  updateMembre(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('membreId', ParseUUIDPipe) membreId: string,
    @Body() dto: UpdateMembreEvaluationDto,
  ) {
    return this.service.updateMembre(id, membreId, dto);
  }

  @Delete(':id/membres/:membreId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retirer un membre d\'une commission d\'évaluation' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiParam({ name: 'membreId', description: 'UUID du membre', type: String })
  @ApiResponse({ status: 204, description: 'Membre retiré' })
  @ApiResponse({ status: 404, description: 'Commission ou membre introuvable' })
  @ApiResponse({ status: 401, description: 'Non autorisé — header X-User-Id manquant ou session invalide' })
  removeMembre(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('membreId', ParseUUIDPipe) membreId: string,
  ) {
    return this.service.removeMembre(id, membreId);
  }

  @Get(':id/export-pdf')
  @ApiOperation({ summary: 'Exporter la commission d\'évaluation en PDF' })
  @ApiParam({ name: 'id', description: 'UUID de la commission', type: String })
  @ApiResponse({ status: 200, description: 'Fichier PDF téléchargé' })
  @ApiResponse({ status: 404, description: 'Commission introuvable' })
  @ApiResponse({ status: 401, description: 'Non autorisé — header X-User-Id manquant ou session invalide' })
  async exportPdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const { buffer, fileName } = await this.service.exportPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }
}
