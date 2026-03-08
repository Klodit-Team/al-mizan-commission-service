import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CommissionEvaluationService } from './commission-evaluation.service';
import { CommissionEvaluation } from './entities/commission-evaluation.entity';
import { MembreEvaluation } from './entities/membre-evaluation.entity';
import { StatutEvaluation } from '../common/enums/statut-evaluation.enum';
import { RoleMembreEvaluation } from '../common/enums/role-membre.enum';
import { RABBITMQ_CLIENT } from '../common/messaging/rabbitmq.module';
import { MinioService } from '../common/services/minio.service';

describe('CommissionEvaluationService', () => {
  let service: CommissionEvaluationService;
  let commissionRepo: jest.Mocked<Repository<CommissionEvaluation>>;
  let membreRepo: jest.Mocked<Repository<MembreEvaluation>>;
  let rabbitClient: { emit: jest.Mock };
  let minioService: { uploadFile: jest.Mock };

  const mockCommission = {
    id: 'uuid-1',
    reference: 'CE-2024-0001',
    objet: 'Test Commission',
    dateCreation: new Date('2024-01-01'),
    dateReunion: new Date('2024-02-01'),
    statut: StatutEvaluation.BROUILLON,
    presidentId: 'president-uuid',
    observations: '',
    membres: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as CommissionEvaluation;

  const mockMembre: MembreEvaluation = {
    id: 'membre-uuid',
    commissionId: 'uuid-1',
    userId: 'user-uuid',
    nom: 'Doe',
    prenom: 'John',
    role: RoleMembreEvaluation.MEMBRE,
    dateNomination: new Date(),
    actif: true,
    commission: mockCommission,
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockCommission], 1]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionEvaluationService,
        {
          provide: getRepositoryToken(CommissionEvaluation),
          useValue: {
            create: jest.fn().mockReturnValue(mockCommission),
            save: jest.fn().mockResolvedValue(mockCommission),
            findOne: jest.fn().mockResolvedValue(mockCommission),
            findAndCount: jest.fn().mockResolvedValue([[mockCommission], 1]),
            count: jest.fn().mockResolvedValue(0),
            remove: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(MembreEvaluation),
          useValue: {
            create: jest.fn().mockReturnValue(mockMembre),
            save: jest.fn().mockResolvedValue(mockMembre),
            find: jest.fn().mockResolvedValue([mockMembre]),
            findOne: jest.fn().mockResolvedValue(null),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: RABBITMQ_CLIENT,
          useValue: {
            emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
          },
        },
        {
          provide: MinioService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('http://minio/file.pdf'),
          },
        },
      ],
    }).compile();

    service = module.get<CommissionEvaluationService>(CommissionEvaluationService);
    commissionRepo = module.get(getRepositoryToken(CommissionEvaluation));
    membreRepo = module.get(getRepositoryToken(MembreEvaluation));
    rabbitClient = module.get(RABBITMQ_CLIENT);
    minioService = module.get(MinioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a commission and emit event', async () => {
      const dto = {
        objet: 'Test Commission',
        dateCreation: '2024-01-01',
        presidentId: 'president-uuid',
      };

      const result = await service.create(dto as any);

      expect(commissionRepo.create).toHaveBeenCalled();
      expect(commissionRepo.save).toHaveBeenCalled();
      expect(rabbitClient.emit).toHaveBeenCalled();
      expect(result).toEqual(mockCommission);
    });
  });

  describe('findOne', () => {
    it('should return a commission by id', async () => {
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockCommission);
    });

    it('should throw NotFoundException if commission not found', async () => {
      commissionRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockCommission]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should search by reference or objet', async () => {
      const result = await service.findAll({ page: 1, limit: 10, search: 'test' });

      expect(commissionRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result.data).toEqual([mockCommission]);
    });
  });

  describe('update', () => {
    it('should update a commission', async () => {
      const dto = { objet: 'Updated objet' };
      const result = await service.update('uuid-1', dto as any);

      expect(commissionRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockCommission);
    });
  });

  describe('remove', () => {
    it('should delete a commission', async () => {
      await service.remove('uuid-1');
      expect(commissionRepo.remove).toHaveBeenCalledWith(mockCommission);
    });
  });

  describe('changeStatut', () => {
    it('should change status and emit event', async () => {
      const dto = { statut: StatutEvaluation.ACTIVE };
      const result = await service.changeStatut('uuid-1', dto);

      expect(commissionRepo.save).toHaveBeenCalled();
      expect(rabbitClient.emit).toHaveBeenCalled();
      expect(result).toEqual(mockCommission);
    });
  });

  describe('findMembres', () => {
    it('should return membres of a commission', async () => {
      const result = await service.findMembres('uuid-1');
      expect(result).toEqual([mockMembre]);
    });
  });

  describe('addMembre', () => {
    it('should add a membre to commission', async () => {
      const dto = {
        userId: 'new-user',
        nom: 'Smith',
        prenom: 'Jane',
        role: RoleMembreEvaluation.MEMBRE,
      };

      const result = await service.addMembre('uuid-1', dto as any);
      expect(membreRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockMembre);
    });

    it('should throw ConflictException if membre already exists', async () => {
      membreRepo.findOne.mockResolvedValue(mockMembre);
      const dto = { userId: 'existing-user' };

      await expect(service.addMembre('uuid-1', dto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('removeMembre', () => {
    it('should remove a membre', async () => {
      membreRepo.findOne.mockResolvedValue(mockMembre);
      await service.removeMembre('uuid-1', 'membre-uuid');
      expect(membreRepo.remove).toHaveBeenCalledWith(mockMembre);
    });

    it('should throw NotFoundException if membre not found', async () => {
      membreRepo.findOne.mockResolvedValue(null);
      await expect(service.removeMembre('uuid-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportPdf', () => {
    it('should generate PDF and upload to MinIO', async () => {
      const result = await service.exportPdf('uuid-1');

      expect(minioService.uploadFile).toHaveBeenCalled();
      expect(result.url).toBe('http://minio/file.pdf');
    });
  });
});
