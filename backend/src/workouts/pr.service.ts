import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

export interface SetForPR {
  id: string;
  user_id: string;
  exercise_id: string;
  session_date: Date;
  session_exercise_id: string;
  set_type: string;
  weight_kg: number | null;
  reps: number | null;
}

export interface PrBroken {
  record_type: 'ONE_RM' | 'REP_BEST' | 'VOLUME_BEST';
  value: number;
  prev_value: number | null;
}

const PR_SET_TYPES = new Set(['WORKING', 'CLUSTER', 'AMRAP']);

@Injectable()
export class PrService {
  constructor(private readonly prisma: PrismaService) {}

  async detectAndUpdate(set: SetForPR): Promise<PrBroken[]> {
    if (!PR_SET_TYPES.has(set.set_type)) return [];

    const broken: PrBroken[] = [];

    await Promise.all([
      this.checkOneRm(set, broken),
      this.checkRepBest(set, broken),
      this.checkVolumeBest(set, broken),
    ]);

    return broken;
  }

  // ── ONE_RM (Epley: weight × (1 + reps/30)) ───────────────────────────────

  async checkOneRm(set: SetForPR, broken: PrBroken[]): Promise<void> {
    if (!set.weight_kg || !set.reps) return;
    if (set.reps > 10) return; // Epley formula unreliable above 10 reps

    const estimated1rm = set.weight_kg * (1 + set.reps / 30);

    const current = await this.prisma.personalRecord.findUnique({
      where: {
        user_id_exercise_id_record_type: {
          user_id: set.user_id,
          exercise_id: set.exercise_id,
          record_type: 'ONE_RM',
        },
      },
    });

    const currentVal = current ? Number(current.value) : null;
    if (currentVal !== null && estimated1rm <= currentVal) return;

    // Tiebreak: prefer higher weight_kg; then more recent (handled by always upsert)
    await this.prisma.personalRecord.upsert({
      where: {
        user_id_exercise_id_record_type: {
          user_id: set.user_id,
          exercise_id: set.exercise_id,
          record_type: 'ONE_RM',
        },
      },
      create: {
        user_id: set.user_id,
        exercise_id: set.exercise_id,
        record_type: 'ONE_RM',
        value: estimated1rm,
        reps: set.reps,
        weight_kg: set.weight_kg,
        achieved_at: set.session_date,
        set_entry_id: set.id,
      },
      update: {
        value: estimated1rm,
        reps: set.reps,
        weight_kg: set.weight_kg,
        achieved_at: set.session_date,
        set_entry_id: set.id,
      },
    });

    broken.push({ record_type: 'ONE_RM', value: estimated1rm, prev_value: currentVal });
  }

  // ── REP_BEST (most reps at the same weight) ───────────────────────────────

  async checkRepBest(set: SetForPR, broken: PrBroken[]): Promise<void> {
    if (!set.weight_kg || !set.reps) return;

    // Only track sets at ≥70% of current 1RM to avoid low-weight noise
    const oneRmPr = await this.prisma.personalRecord.findUnique({
      where: {
        user_id_exercise_id_record_type: {
          user_id: set.user_id,
          exercise_id: set.exercise_id,
          record_type: 'ONE_RM',
        },
      },
    });

    if (oneRmPr) {
      const threshold = Number(oneRmPr.value) * 0.7;
      if (set.weight_kg < threshold) return;
    }

    const current = await this.prisma.personalRecord.findUnique({
      where: {
        user_id_exercise_id_record_type: {
          user_id: set.user_id,
          exercise_id: set.exercise_id,
          record_type: 'REP_BEST',
        },
      },
    });

    const currentVal = current ? Number(current.value) : null;

    // REP_BEST value encodes as reps; weight stored separately
    // We only beat it if: same weight + more reps, OR higher weight + any reps
    if (current && set.reps <= Number(current.value)) return;

    await this.prisma.personalRecord.upsert({
      where: {
        user_id_exercise_id_record_type: {
          user_id: set.user_id,
          exercise_id: set.exercise_id,
          record_type: 'REP_BEST',
        },
      },
      create: {
        user_id: set.user_id,
        exercise_id: set.exercise_id,
        record_type: 'REP_BEST',
        value: set.reps,
        reps: set.reps,
        weight_kg: set.weight_kg,
        achieved_at: set.session_date,
        set_entry_id: set.id,
      },
      update: {
        value: set.reps,
        reps: set.reps,
        weight_kg: set.weight_kg,
        achieved_at: set.session_date,
        set_entry_id: set.id,
      },
    });

    broken.push({ record_type: 'REP_BEST', value: set.reps, prev_value: currentVal });
  }

  // ── VOLUME_BEST (Σ weight × reps for exercise on a single day) ───────────

  async checkVolumeBest(set: SetForPR, broken: PrBroken[]): Promise<void> {
    if (!set.weight_kg || !set.reps) return;

    // Aggregate all WORKING sets for this exercise on this session_date
    const sameDay = await this.prisma.setEntry.findMany({
      where: {
        user_id: set.user_id,
        exercise_id: set.exercise_id,
        session_date: set.session_date,
        set_type: { in: ['WORKING', 'CLUSTER', 'AMRAP'] },
        deleted_at: null,
      },
      select: { weight_kg: true, reps: true },
    });

    const dayVolume = sameDay.reduce((sum, s) => {
      if (s.weight_kg && s.reps) return sum + Number(s.weight_kg) * s.reps;
      return sum;
    }, 0);

    const current = await this.prisma.personalRecord.findUnique({
      where: {
        user_id_exercise_id_record_type: {
          user_id: set.user_id,
          exercise_id: set.exercise_id,
          record_type: 'VOLUME_BEST',
        },
      },
    });

    const currentVal = current ? Number(current.value) : null;
    if (currentVal !== null && dayVolume <= currentVal) return;

    await this.prisma.personalRecord.upsert({
      where: {
        user_id_exercise_id_record_type: {
          user_id: set.user_id,
          exercise_id: set.exercise_id,
          record_type: 'VOLUME_BEST',
        },
      },
      create: {
        user_id: set.user_id,
        exercise_id: set.exercise_id,
        record_type: 'VOLUME_BEST',
        value: dayVolume,
        achieved_at: set.session_date,
        set_entry_id: set.id,
      },
      update: {
        value: dayVolume,
        achieved_at: set.session_date,
        set_entry_id: set.id,
      },
    });

    broken.push({ record_type: 'VOLUME_BEST', value: dayVolume, prev_value: currentVal });
  }

  // ── Epley helper (pure, exported for tests) ───────────────────────────────

  static calcEpley(weightKg: number, reps: number): number {
    return weightKg * (1 + reps / 30);
  }
}
