import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { CoachService } from './coach.service';
import { PrismaService } from '@/database/prisma.service';

const INVITATION = {
  id: 'inv-1',
  coach_id: 'coach-1',
  invite_code: 'ABCD1234',
  athlete_email: 'athlete@example.com',
  expires_at: new Date(Date.now() + 86400000 * 7),
  accepted_at: null,
  revoked_at: null,
};

const LINK = {
  id: 'link-1',
  coach_id: 'coach-1',
  athlete_id: 'athlete-1',
  status: 'ACTIVE',
  athlete: { id: 'athlete-1', username: 'athlete', avatar_url: null },
};

const buildPrismaMock = () => ({
  coachAthleteLink: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  coachInvitation: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  coachComment: {
    create: jest.fn(),
  },
  weeklyCheckIn: {
    findFirst: jest.fn(),
  },
  workoutSession: {
    findFirst: jest.fn(),
  },
});

describe('CoachService', () => {
  let service: CoachService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoachService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get<CoachService>(CoachService);
    jest.clearAllMocks();
  });

  describe('listAthletes', () => {
    it('returns active athlete links', async () => {
      prismaMock.coachAthleteLink.findMany.mockResolvedValue([LINK]);
      const result = await service.listAthletes('coach-1');
      expect(result).toEqual([LINK]);
    });
  });

  describe('getAthlete', () => {
    it('returns link if active', async () => {
      prismaMock.coachAthleteLink.findFirst.mockResolvedValue(LINK);
      const result = await service.getAthlete('coach-1', 'athlete-1');
      expect(result).toBe(LINK);
    });

    it('throws NotFoundException if not found', async () => {
      prismaMock.coachAthleteLink.findFirst.mockResolvedValue(null);
      await expect(service.getAthlete('coach-1', 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createInvite', () => {
    const dto = { athlete_email: 'athlete@example.com', client_op_id: 'op-inv-1', client_ts: new Date().toISOString() };

    it('returns existing invitation if pending', async () => {
      prismaMock.coachInvitation.findFirst.mockResolvedValue(INVITATION);
      const result = await service.createInvite('coach-1', dto);
      expect(result).toBe(INVITATION);
      expect(prismaMock.coachInvitation.create).not.toHaveBeenCalled();
    });

    it('creates new invitation with 8-char code', async () => {
      prismaMock.coachInvitation.findFirst.mockResolvedValue(null);
      prismaMock.coachInvitation.create.mockResolvedValue(INVITATION);
      const result = await service.createInvite('coach-1', dto);
      expect(prismaMock.coachInvitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ invite_code: expect.stringMatching(/^[A-F0-9]{8}$/) }),
        }),
      );
    });
  });

  describe('acceptInvite', () => {
    it('throws NotFoundException for invalid code', async () => {
      prismaMock.coachInvitation.findFirst.mockResolvedValue(null);
      await expect(service.acceptInvite('INVALID', 'athlete-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for expired invitation', async () => {
      const expired = { ...INVITATION, expires_at: new Date(Date.now() - 1000) };
      prismaMock.coachInvitation.findFirst.mockResolvedValue(expired);
      await expect(service.acceptInvite('ABCD1234', 'athlete-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException if already active link exists', async () => {
      prismaMock.coachInvitation.findFirst.mockResolvedValue(INVITATION);
      prismaMock.coachAthleteLink.findFirst.mockResolvedValue(LINK);
      await expect(service.acceptInvite('ABCD1234', 'athlete-1')).rejects.toThrow(ConflictException);
    });

    it('creates new link for valid invitation', async () => {
      prismaMock.coachInvitation.findFirst.mockResolvedValue(INVITATION);
      prismaMock.coachAthleteLink.findFirst.mockResolvedValue(null);
      prismaMock.coachAthleteLink.create.mockResolvedValue(LINK);
      prismaMock.coachInvitation.update.mockResolvedValue({});
      const result = await service.acceptInvite('ABCD1234', 'athlete-1');
      expect(result).toBe(LINK);
    });
  });

  describe('endLink', () => {
    it('sets status to ENDED', async () => {
      prismaMock.coachAthleteLink.findFirst.mockResolvedValue(LINK);
      prismaMock.coachAthleteLink.update.mockResolvedValue({ ...LINK, status: 'ENDED' });
      const result = await service.endLink('link-1', 'coach-1');
      expect(prismaMock.coachAthleteLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ENDED' }) }),
      );
    });

    it('throws NotFoundException if link not found', async () => {
      prismaMock.coachAthleteLink.findFirst.mockResolvedValue(null);
      await expect(service.endLink('bad-id', 'coach-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addComment', () => {
    const dto = { athlete_id: 'athlete-1', target_type: 'CHECK_IN', target_id: 'ci-1', content: '做得不错' };

    it('creates comment', async () => {
      const COMMENT = { id: 'comment-1', ...dto, coach_id: 'coach-1' };
      prismaMock.coachComment.create.mockResolvedValue(COMMENT);
      const result = await service.addComment('coach-1', dto);
      expect(result).toBe(COMMENT);
      expect(prismaMock.coachComment.create).toHaveBeenCalled();
    });
  });
});
