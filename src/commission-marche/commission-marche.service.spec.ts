import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CommissionMarcheService } from './commission-marche.service';
import { CommissionMarche } from './entities/commission-marche.entity';
import { MembreMarche } from './entities/membre-marche.entity';
import { StatutMarche } from '../common/enums/statut-marche.enum';
import { TypeMarche } from '../common/enums/type-marche.enum';
import { RoleMembreMarche } from '../common/enums/role-membre.enum';
import { RABBITMQ_CLIENT } from '../common/messaging/rabbitmq.module';
import { MinioService } from '../common/services/minio.service';

describe('CommissionMarcheService', () => {
  let service: CommissionMarcheService;
  let commissionRepo: jest.Mocked<Repository<CommissionMarche>>;
  let membreRepo: jest.Mocked<Repository<MembreMarche>>;
  let rabbitClient: { emit: jest.Mock };
  let minioService: { uploadFile: jest.Mock };

  const mockCommission = {
    id: 'uuid-1',
    reference: 'CM-2024-0001',
    intitule: 'Test Marché',
    typeMarche: TypeMarche.TRAVAUX,
    montantEstime: 1000000,
    dateOuvertureOffres: new Date('2024-02-01'),
    dateDeliberations: new Date('2024-03-01'),
    statut: StatutMarche.EN_COURS,
    presidentId: 'president-uuid',
    pvDeliberation: '',
    soumissionnairesCount: 5,
    soumissionnairesRetenu: '',
    membres: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as CommissionMarche;

  const mockMembre = {
    id: 'membre-uuid',
    commissionId: 'uuid-1',
    userId: 'user-uuid',
    nom: 'Doe',
    prenom: 'John',
    fonction: 'Ingénieur',
    role: RoleMembreMarche.MEMBRE,
    dateNomination: new Date(),
    actif: true,
    commission: mockCommission,
  } as MembreMarche;

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
        CommissionMarcheService,
        {
          provide: getRepositoryToken(CommissionMarche),
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
          provide: getRepositoryToken(MembreMarche),
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

    service = module.get<CommissionMarcheService>(CommissionMarcheService);
    commissionRepo = module.get(getRepositoryToken(CommissionMarche));
    membreRepo = module.get(getRepositoryToken(MembreMarche));
    rabbitClient = module.get(RABBITMQ_CLIENT);
    minioService = module.get(MinioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a commission and emit event', async () => {
      const dto = {
        intitule: 'Test Marché',
        typeMarche: TypeMarche.TRAVAUX,
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
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockCommission]);
      expect(result.total).toBe(1);
    });

    it('should search by reference or intitule', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 10,
        search: 'test',
      });

      expect(commissionRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result.data).toEqual([mockCommission]);
    });
  });

  describe('update', () => {
    it('should update a commission', async () => {
      const dto = { intitule: 'Updated intitule' };
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
      const dto = { statut: StatutMarche.DELIBERATION };
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
        role: RoleMembreMarche.MEMBRE,
      };

      const result = await service.addMembre('uuid-1', dto as any);
      expect(membreRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockMembre);
    });

    it('should throw ConflictException if membre already exists', async () => {
      membreRepo.findOne.mockResolvedValue(mockMembre);
      const dto = { userId: 'existing-user' };

      await expect(service.addMembre('uuid-1', dto as any)).rejects.toThrow(
        ConflictException,
      );
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
      await expect(service.removeMembre('uuid-1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setDeliberation', () => {
    it('should set deliberation PV and emit event', async () => {
      const dto = { pvDeliberation: 'PV content', soumissionnairesCount: 5 };
      const result = await service.setDeliberation('uuid-1', dto);

      expect(commissionRepo.save).toHaveBeenCalled();
      expect(rabbitClient.emit).toHaveBeenCalled();
      expect(result).toEqual(mockCommission);
    });
  });

  describe('getDeliberation', () => {
    it('should return deliberation PV', async () => {
      const result = await service.getDeliberation('uuid-1');

      expect(result.commissionId).toBe('uuid-1');
    });
  });

  describe('attribuerMarche', () => {
    it('should attribute market and emit event', async () => {
      const dto = { soumissionnairesRetenu: 'Entreprise ABC' };
      const result = await service.attribuerMarche('uuid-1', dto);

      expect(commissionRepo.save).toHaveBeenCalled();
      expect(rabbitClient.emit).toHaveBeenCalled();
      expect(result).toEqual(mockCommission);
    });
  });

  describe('exportPdf', () => {
    it('should generate PDF buffer and return fileName', async () => {
      const result = await service.exportPdf('uuid-1');

      expect(result.fileName).toContain('commission-marche');
      expect(result.buffer).toBeInstanceOf(Buffer);
    });
  });
});
