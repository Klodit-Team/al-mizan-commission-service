import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
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
import { SeanceOuvertureService } from './seance-ouverture.service';
import { CreateSeanceDto } from './dto/create-seance.dto';
import { UpdateSeanceDto } from './dto/update-seance.dto';
import { CreateResultatDto } from './dto/create-resultat.dto';
import { UpdateResultatDto } from './dto/update-resultat.dto';
import { GatewayGuard } from '../common/guards/gateway.guard';

@ApiTags('seances-ouverture')
@ApiHeader({ name: 'X-User-Id', required: true, description: 'ID utilisateur (via Gateway)' })
@ApiHeader({ name: 'X-User-Roles', required: true, description: 'Rôles utilisateur (via Gateway)' })
@Controller('api/v1/seances-ouverture')
@UseGuards(GatewayGuard)
export class SeanceOuvertureController {
  constructor(private readonly service: SeanceOuvertureService) {}

  @Post()
  @ApiOperation({ summary: 'Programmer une séance d\'ouverture' })
  @ApiResponse({ status: 201, description: 'Séance programmée' })
  create(@Body() dto: CreateSeanceDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des séances d\'ouverture' })
  @ApiQuery({ name: 'commissionId', required: false })
  @ApiResponse({ status: 200, description: 'Liste des séances' })
  findAll(@Query('commissionId') commissionId?: string) {
    return this.service.findAll(commissionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une séance par ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Séance trouvée' })
  @ApiResponse({ status: 404, description: 'Séance introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une séance' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Séance modifiée' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSeanceDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une séance programmée' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 204, description: 'Séance supprimée' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(id);
  }

  @Patch(':id/demarrer')
  @ApiOperation({ summary: 'Démarrer la séance' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Séance démarrée' })
  demarrer(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.demarrer(id);
  }

  @Patch(':id/terminer')
  @ApiOperation({ summary: 'Terminer la séance' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Séance terminée' })
  terminer(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.terminer(id);
  }

  @Post(':id/pv')
  @ApiOperation({ summary: 'Générer le PV d\'ouverture (upload MinIO)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 201, description: 'PV généré', schema: { properties: { url: { type: 'string' } } } })
  generatePV(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.generatePV(id);
  }

  @Get(':id/pv')
  @ApiOperation({ summary: 'Télécharger le PV d\'ouverture (fichier PDF)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Fichier PDF' })
  @ApiResponse({ status: 404, description: 'PV non généré' })
  async getPV(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const { fileName, stream } = await this.service.getPV(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    stream.pipe(res);
  }

  // Résultats d'ouverture
  @Get(':id/resultats')
  @ApiOperation({ summary: 'Lister les résultats d\'ouverture d\'une séance' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la séance' })
  @ApiResponse({ status: 200, description: 'Liste des résultats' })
  @ApiResponse({ status: 404, description: 'Séance introuvable' })
  getResultats(@Param('id', ParseUUIDPipe) seanceId: string) {
    return this.service.getResultats(seanceId);
  }

  @Post(':id/resultats')
  @ApiOperation({ summary: 'Enregistrer un résultat d\'ouverture' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la séance' })
  @ApiResponse({ status: 201, description: 'Résultat enregistré' })
  addResultat(
    @Param('id', ParseUUIDPipe) seanceId: string,
    @Body() dto: CreateResultatDto,
  ) {
    return this.service.addResultat(seanceId, dto);
  }

  @Put(':id/resultats/:resultatId')
  @ApiOperation({ summary: 'Modifier un résultat d\'ouverture' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la séance' })
  @ApiParam({ name: 'resultatId', type: 'string', description: 'ID du résultat' })
  @ApiResponse({ status: 200, description: 'Résultat modifié' })
  updateResultat(
    @Param('id', ParseUUIDPipe) seanceId: string,
    @Param('resultatId', ParseUUIDPipe) resultatId: string,
    @Body() dto: UpdateResultatDto,
  ) {
    return this.service.updateResultat(seanceId, resultatId, dto);
  }

  @Delete(':id/resultats/:resultatId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un résultat d\'ouverture' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la séance' })
  @ApiParam({ name: 'resultatId', type: 'string', description: 'ID du résultat' })
  @ApiResponse({ status: 204, description: 'Résultat supprimé' })
  deleteResultat(
    @Param('id', ParseUUIDPipe) seanceId: string,
    @Param('resultatId', ParseUUIDPipe) resultatId: string,
  ) {
    return this.service.deleteResultat(seanceId, resultatId);
  }
}
