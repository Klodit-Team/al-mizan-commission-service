import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SeanceOuvertureService } from './seance-ouverture.service';
import { SeanceOuverture } from './entities/seance-ouverture.entity';
import { ResultatOuverture } from './entities/resultat-ouverture.entity';
import { TypeSeance } from '../common/enums/type-seance.enum';
import { StatutSeance } from '../common/enums/statut-seance.enum';
import { MinioService } from '../common/services/minio.service';

describe('SeanceOuvertureService', () => {
  let service: SeanceOuvertureService;
  let seanceRepo: jest.Mocked<Repository<SeanceOuverture>>;
  let resultatRepo: jest.Mocked<Repository<ResultatOuverture>>;
  let rabbitClient: { emit: jest.Mock };
  let minioService: { uploadFile: jest.Mock };

  const mockSeance = {
    id: 'seance-uuid',
    appelOffreId: 'ao-uuid',
    commissionId: 'commission-uuid',
    commission: {} as any,
    type: TypeSeance.OFFRE_TECHNIQUE,
    dateSeance: new Date('2024-03-15T10:00:00Z'),
    lieu: 'Salle A',
    statut: StatutSeance.PROGRAMMEE,
    isPublique: true,
    pvUrl: '',
    resultats: [],
    createdAt: new Date(),
  } as SeanceOuverture;

  const mockResultat = {
    id: 'resultat-uuid',
    seanceId: 'seance-uuid',
    seance: mockSeance,
    soumissionId: 'soumission-uuid',
    pliRecu: true,
    pliConforme: true,
    observations: 'OK',
    createdAt: new Date(),
  } as ResultatOuverture;

  beforeEach(async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockSeance]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeanceOuvertureService,
        {
          provide: getRepositoryToken(SeanceOuverture),
          useValue: {
            create: jest.fn().mockReturnValue(mockSeance),
            save: jest.fn().mockResolvedValue(mockSeance),
            findOne: jest.fn().mockResolvedValue(mockSeance),
            remove: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(ResultatOuverture),
          useValue: {
            create: jest.fn().mockReturnValue(mockResultat),
            save: jest.fn().mockResolvedValue(mockResultat),
            findOne: jest.fn().mockResolvedValue(null),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: 'RABBITMQ_CLIENT',
          useValue: {
            emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
          },
        },
        {
          provide: MinioService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('http://minio/pv.pdf'),
          },
        },
      ],
    }).compile();

    service = module.get<SeanceOuvertureService>(SeanceOuvertureService);
    seanceRepo = module.get(getRepositoryToken(SeanceOuverture));
    resultatRepo = module.get(getRepositoryToken(ResultatOuverture));
    rabbitClient = module.get('RABBITMQ_CLIENT');
    minioService = module.get(MinioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a seance and emit event', async () => {
      const dto = {
        appelOffreId: 'ao-uuid',
        commissionId: 'commission-uuid',
        type: TypeSeance.OFFRE_TECHNIQUE,
        dateSeance: '2024-03-15T10:00:00Z',
        lieu: 'Salle A',
      };

      const result = await service.create(dto);

      expect(seanceRepo.create).toHaveBeenCalled();
      expect(seanceRepo.save).toHaveBeenCalled();
      expect(rabbitClient.emit).toHaveBeenCalled();
      expect(result).toEqual(mockSeance);
    });
  });

  describe('findOne', () => {
    it('should return a seance by id', async () => {
      const result = await service.findOne('seance-uuid');
      expect(result).toEqual(mockSeance);
    });

    it('should throw NotFoundException if seance not found', async () => {
      seanceRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all seances', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockSeance]);
    });

    it('should filter by commissionId', async () => {
      const result = await service.findAll('commission-uuid');
      expect(seanceRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual([mockSeance]);
    });
  });

  describe('update', () => {
    it('should update a seance', async () => {
      const dto = { lieu: 'Salle B' };
      const result = await service.update('seance-uuid', dto);

      expect(seanceRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockSeance);
    });

    it('should throw BadRequestException if seance is TERMINEE', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.TERMINEE });
      await expect(service.update('seance-uuid', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete a PROGRAMMEE seance', async () => {
      await service.delete('seance-uuid');
      expect(seanceRepo.remove).toHaveBeenCalledWith(mockSeance);
    });

    it('should throw BadRequestException if seance is not PROGRAMMEE', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.EN_COURS });
      await expect(service.delete('seance-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('demarrer', () => {
    it('should start a seance and emit event', async () => {
      const result = await service.demarrer('seance-uuid');

      expect(seanceRepo.save).toHaveBeenCalled();
      expect(rabbitClient.emit).toHaveBeenCalled();
      expect(result).toEqual(mockSeance);
    });

    it('should throw BadRequestException if seance is not PROGRAMMEE', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.EN_COURS });
      await expect(service.demarrer('seance-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('terminer', () => {
    it('should end a seance and emit event', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.EN_COURS });
      const result = await service.terminer('seance-uuid');

      expect(seanceRepo.save).toHaveBeenCalled();
      expect(rabbitClient.emit).toHaveBeenCalled();
      expect(result).toEqual(mockSeance);
    });

    it('should throw BadRequestException if seance is not EN_COURS', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.PROGRAMMEE });
      await expect(service.terminer('seance-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('addResultat', () => {
    it('should add a resultat', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.EN_COURS });
      resultatRepo.findOne.mockResolvedValue(null);
      const dto = {
        soumissionId: 'soumission-uuid',
        pliRecu: true,
        pliConforme: true,
        observations: 'OK',
      };

      const result = await service.addResultat('seance-uuid', dto);

      expect(resultatRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockResultat);
    });

    it('should throw BadRequestException if seance is TERMINEE', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.TERMINEE });
      await expect(service.addResultat('seance-uuid', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if resultat already exists', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.EN_COURS });
      resultatRepo.findOne.mockResolvedValue(mockResultat);
      await expect(service.addResultat('seance-uuid', { soumissionId: 'existing' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateResultat', () => {
    it('should update a resultat', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.EN_COURS });
      resultatRepo.findOne.mockResolvedValue(mockResultat);
      const dto = { observations: 'Updated' };

      const result = await service.updateResultat('seance-uuid', 'resultat-uuid', dto);

      expect(resultatRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockResultat);
    });

    it('should throw BadRequestException if seance is TERMINEE', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.TERMINEE });
      await expect(service.updateResultat('seance-uuid', 'resultat-uuid', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if resultat not found', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.EN_COURS });
      resultatRepo.findOne.mockResolvedValue(null);
      await expect(service.updateResultat('seance-uuid', 'invalid', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteResultat', () => {
    it('should delete a resultat', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.EN_COURS });
      resultatRepo.findOne.mockResolvedValue(mockResultat);
      await service.deleteResultat('seance-uuid', 'resultat-uuid');
      expect(resultatRepo.remove).toHaveBeenCalledWith(mockResultat);
    });

    it('should throw BadRequestException if seance is TERMINEE', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.TERMINEE });
      await expect(service.deleteResultat('seance-uuid', 'invalid')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if resultat not found', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.EN_COURS });
      resultatRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteResultat('seance-uuid', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('generatePV', () => {
    it('should generate PV and upload to MinIO', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.TERMINEE, resultats: [] });

      const result = await service.generatePV('seance-uuid');

      expect(minioService.uploadFile).toHaveBeenCalled();
      expect(seanceRepo.save).toHaveBeenCalled();
      expect(rabbitClient.emit).toHaveBeenCalled();
      expect(result.url).toBe('http://minio/pv.pdf');
    });

    it('should throw BadRequestException if seance is not TERMINEE', async () => {
      seanceRepo.findOne.mockResolvedValue({ ...mockSeance, statut: StatutSeance.PROGRAMMEE });
      await expect(service.generatePV('seance-uuid')).rejects.toThrow(BadRequestException);
    });
  });
});
