import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { randomBytes } from 'crypto';

export interface InviteAthleteDto {
  athlete_email?: string;
  client_op_id: string;
  client_ts: string;
}

export interface UpdateScopesDto {
  scope_training?: boolean;
  scope_nutrition?: boolean;
  scope_body_basic?: boolean;
  scope_body_photos?: boolean;
  scope_expenses?: boolean;
  scope_controlled?: boolean;
}

export interface CoachCommentDto {
  athlete_id: string;
  target_type: string;
  target_id: string;
  content: string;
  is_actionable?: boolean;
}

@Injectable()
export class CoachService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboard(coachId: string) {
    const links = await this.prisma.coachAthleteLink.findMany({
      where: { coach_id: coachId, status: 'ACTIVE' },
      include: {
        athlete: {
          select: { id: true, username: true, avatar_url: true },
        },
      },
    });

    const athletes = await Promise.all(
      links.map(async (link) => {
        const [lastCheckIn, lastSession] = await Promise.all([
          this.prisma.weeklyCheckIn.findFirst({
            where: { user_id: link.athlete_id, deleted_at: null },
            orderBy: { check_in_date: 'desc' },
            select: { status: true, check_in_date: true },
          }),
          this.prisma.workoutSession.findFirst({
            where: { user_id: link.athlete_id, deleted_at: null },
            orderBy: { session_date: 'desc' },
            select: { session_date: true },
          }),
        ]);

        return {
          link,
          athlete: link.athlete,
          last_check_in: lastCheckIn,
          last_session: lastSession,
        };
      }),
    );

    return { total_athletes: links.length, athletes };
  }

  async listAthletes(coachId: string) {
    return this.prisma.coachAthleteLink.findMany({
      where: { coach_id: coachId, status: 'ACTIVE' },
      include: { athlete: { select: { id: true, username: true, avatar_url: true, email: true } } },
    });
  }

  async getAthlete(coachId: string, athleteId: string) {
    const link = await this.prisma.coachAthleteLink.findFirst({
      where: { coach_id: coachId, athlete_id: athleteId, status: 'ACTIVE' },
    });
    if (!link) throw new NotFoundException('学员不存在或未建立教练关系');
    return link;
  }

  // ── Coach Links ────────────────────────────────────────────────────────────

  async createInvite(coachId: string, dto: InviteAthleteDto) {
    const existing = await this.prisma.coachInvitation.findFirst({
      where: { coach_id: coachId, athlete_email: dto.athlete_email, accepted_at: null, revoked_at: null },
    });
    if (existing) return existing;

    const inviteCode = randomBytes(5).toString('hex').slice(0, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.coachInvitation.create({
      data: {
        coach_id: coachId,
        invite_code: inviteCode,
        athlete_email: dto.athlete_email,
        expires_at: expiresAt,
      },
    });
  }

  async acceptInvite(linkId: string, athleteId: string) {
    const invitation = await this.prisma.coachInvitation.findFirst({
      where: { invite_code: linkId, accepted_at: null, revoked_at: null },
    });
    if (!invitation) throw new NotFoundException('邀请码无效或已过期');
    if (new Date() > invitation.expires_at) throw new ForbiddenException('邀请码已过期');

    const existingLink = await this.prisma.coachAthleteLink.findFirst({
      where: { coach_id: invitation.coach_id, athlete_id: athleteId },
    });
    if (existingLink) {
      if (existingLink.status === 'ACTIVE') throw new ConflictException('已有教练关系');
      return this.prisma.coachAthleteLink.update({
        where: { id: existingLink.id },
        data: { status: 'ACTIVE', started_at: new Date() },
      });
    }

    const { randomUUID } = await import('crypto');
    const link = await this.prisma.coachAthleteLink.create({
      data: {
        coach_id: invitation.coach_id,
        athlete_id: athleteId,
        status: 'ACTIVE',
        invited_by: 'COACH',
        started_at: new Date(),
        client_op_id: randomUUID(),
        client_ts: new Date(),
      },
    });

    await this.prisma.coachInvitation.update({
      where: { id: invitation.id },
      data: { accepted_at: new Date(), accepted_by: athleteId },
    });

    return link;
  }

  async updateScopes(linkId: string, coachId: string, dto: UpdateScopesDto) {
    const link = await this.prisma.coachAthleteLink.findFirst({
      where: { id: linkId, coach_id: coachId },
    });
    if (!link) throw new NotFoundException('教练关系不存在');
    return this.prisma.coachAthleteLink.update({ where: { id: linkId }, data: dto });
  }

  async endLink(linkId: string, coachId: string) {
    const link = await this.prisma.coachAthleteLink.findFirst({
      where: { id: linkId, coach_id: coachId },
    });
    if (!link) throw new NotFoundException('教练关系不存在');
    return this.prisma.coachAthleteLink.update({
      where: { id: linkId },
      data: { status: 'ENDED', ended_at: new Date() },
    });
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  async addComment(coachId: string, dto: CoachCommentDto) {
    const { randomUUID } = await import('crypto');
    return this.prisma.coachComment.create({
      data: {
        coach_id: coachId,
        athlete_id: dto.athlete_id,
        target_type: dto.target_type as never,
        target_id: dto.target_id,
        content: dto.content,
        is_actionable: dto.is_actionable ?? false,
        client_op_id: randomUUID(),
        client_ts: new Date(),
      },
    });
  }
}
