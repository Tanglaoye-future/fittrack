/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RootLayout } from '@/components/common/RootLayout';
import { apiClient } from '@/lib/api-client';

type PhaseTag = 'OFFSEASON' | 'PREP';

interface OfficialTrainingPlan {
  slug: string;
  name: string;
  description: string;
  weeks: number;
  phase_tag: PhaseTag;
  day_count: number;
  total_exercises: number;
  templates: Array<{
    name: string;
    day_of_week: number;
    estimated_minutes: number;
    rest_seconds_default: number;
    notes?: string;
    exercises: Array<{
      exercise_id: string | null;
      exercise_name_zh: string;
      exercise_name_en: string;
      primary_muscle: string | null;
      target_sets: number;
      target_reps_min: number;
      target_reps_max: number;
      target_rir?: number;
      rest_seconds: number;
      tempo?: string;
      notes?: string;
    }>;
  }>;
}

interface OfficialMealPlan {
  slug: string;
  name: string;
  phase_tag: PhaseTag;
  description: string;
  total_kcal: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meal_count: number;
  meals: Array<{
    order_index: number;
    meal_slot: string;
    target_time: string;
    target_kcal: number;
    target_protein_g: number;
    target_carbs_g: number;
    target_fat_g: number;
    notes?: string;
    ingredients: Array<{ food_name_zh: string; grams: number }>;
  }>;
}

const PHASE_LABEL: Record<PhaseTag, { zh: string; color: string }> = {
  OFFSEASON: { zh: '增肌期', color: 'bg-blue-100 text-blue-700' },
  PREP: { zh: '减脂期', color: 'bg-orange-100 text-orange-700' },
};

const MEAL_SLOT_LABEL: Record<string, string> = {
  BREAKFAST: '早餐',
  MORNING_SNACK: '上午加餐',
  PRE_WORKOUT: '训练前',
  INTRA_WORKOUT: '训练中',
  POST_WORKOUT: '训练后',
  LUNCH: '午餐',
  AFTERNOON_SNACK: '下午加餐',
  PRE_DINNER: '晚餐前',
  DINNER: '晚餐',
  LATE_NIGHT: '夜宵',
};

type ToastKind = 'info' | 'success';
interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
  actionHref?: string;
  actionLabel?: string;
}

function genClientOpId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback：随机 16 进制 + 时间戳
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export default function PlansPage() {
  const { isAuthenticated, hydrated } = useAuthStore();
  const router = useRouter();
  const [trainingPlans, setTrainingPlans] = useState<OfficialTrainingPlan[]>([]);
  const [mealPlans, setMealPlans] = useState<OfficialMealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [detailPlan, setDetailPlan] = useState<OfficialTrainingPlan | null>(null);
  const [detailMeal, setDetailMeal] = useState<OfficialMealPlan | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { ...t, id }]);
    setTimeout(() => {
      setToasts((cur) => cur.filter((x) => x.id !== id));
    }, 6000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [tp, mp] = await Promise.all([
        apiClient.get<OfficialTrainingPlan[]>('/training-plans/official-templates'),
        apiClient.get<OfficialMealPlan[]>('/meals/official-plans'),
      ]);
      setTrainingPlans(tp);
      setMealPlans(mp);
    } catch (e: any) {
      setLoadError(e.message || '加载官方计划失败');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    load();
  }, [hydrated, isAuthenticated, load, router]);

  // ESC 关详情弹窗
  useEffect(() => {
    if (!detailPlan && !detailMeal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailPlan(null);
        setDetailMeal(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailPlan, detailMeal]);

  const applyTrainingPlan = async (slug: string) => {
    setBusySlug(slug);
    try {
      await apiClient.post(`/training-plans/from-official/${slug}`, {
        client_op_id: genClientOpId(),
      });
      pushToast({
        kind: 'success',
        text: '已克隆到我的训练计划',
        actionHref: '/workouts',
        actionLabel: '去激活',
      });
    } catch (e: any) {
      pushToast({ kind: 'info', text: e.message || '克隆失败，稍后重试' });
    }
    setBusySlug(null);
  };

  const applyMealPlan = async (slug: string) => {
    setBusySlug(slug);
    try {
      await apiClient.post(`/meals/plan-templates/from-official/${slug}`, {
        client_op_id: genClientOpId(),
      });
      pushToast({
        kind: 'success',
        text: '已克隆到我的餐单',
        actionHref: '/meals',
        actionLabel: '去激活',
      });
    } catch (e: any) {
      pushToast({ kind: 'info', text: e.message || '克隆失败，稍后重试' });
    }
    setBusySlug(null);
  };

  if (!hydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <RootLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">官方计划库</h1>
          <p className="text-sm text-gray-500 mt-1">
            面向高级 / 职业健美选手的哑铃 4 分化训练 + 配套增肌 / 减脂期餐单。基线 70–75 kg 中高级。
          </p>
        </div>

        {loadError && (
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 flex justify-between items-center">
            <span>{loadError}</span>
            <button onClick={load} className="text-sm text-primary-600 underline">
              重试
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-8">加载中...</p>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">🏋️ 训练计划（4 分化 · 哑铃区自由动作）</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {trainingPlans.map((p) => (
                  <div key={p.slug} className="card space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{p.name}</h3>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${PHASE_LABEL[p.phase_tag].color}`}
                        >
                          {PHASE_LABEL[p.phase_tag].zh}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {p.weeks} 周
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{p.description}</p>
                    <div className="text-xs text-gray-500">
                      {p.day_count} 天分化 · {p.total_exercises} 个动作
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-secondary text-sm flex-1"
                        onClick={() => setDetailPlan(p)}
                      >
                        查看每日动作
                      </button>
                      <button
                        className="btn btn-primary text-sm flex-1 disabled:opacity-50"
                        disabled={busySlug === p.slug}
                        onClick={() => applyTrainingPlan(p.slug)}
                      >
                        {busySlug === p.slug ? '克隆中' : '使用'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">🍱 配套餐单（增肌 / 减脂期）</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {mealPlans.map((m) => (
                  <div key={m.slug} className="card space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{m.name}</h3>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${PHASE_LABEL[m.phase_tag].color}`}
                        >
                          {PHASE_LABEL[m.phase_tag].zh}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {m.meal_count} 餐
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{m.description}</p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-gray-500">热量</div>
                        <div className="font-semibold">{m.total_kcal}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-gray-500">蛋白</div>
                        <div className="font-semibold">{m.total_protein_g}g</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-gray-500">碳水</div>
                        <div className="font-semibold">{m.total_carbs_g}g</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-gray-500">脂肪</div>
                        <div className="font-semibold">{m.total_fat_g}g</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-secondary text-sm flex-1"
                        onClick={() => setDetailMeal(m)}
                      >
                        查看每餐食材
                      </button>
                      <button
                        className="btn btn-primary text-sm flex-1 disabled:opacity-50"
                        disabled={busySlug === m.slug}
                        onClick={() => applyMealPlan(m.slug)}
                      >
                        {busySlug === m.slug ? '克隆中' : '使用'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {detailPlan && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setDetailPlan(null)}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold">{detailPlan.name}</h2>
                <button
                  onClick={() => setDetailPlan(null)}
                  className="text-gray-500"
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {detailPlan.templates.map((t) => (
                  <div key={t.day_of_week} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{t.name}</h3>
                      <span className="text-xs text-gray-500">
                        ~{t.estimated_minutes} min · 默认组间 {t.rest_seconds_default}s
                      </span>
                    </div>
                    {t.notes && <p className="text-xs text-gray-500 mb-2">{t.notes}</p>}
                    <table className="w-full text-sm">
                      <thead className="text-xs text-gray-500 border-b">
                        <tr>
                          <th className="text-left py-1">动作</th>
                          <th className="text-center">组×次</th>
                          <th className="text-center">RIR</th>
                          <th className="text-center">休息</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.exercises.map((e, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-1.5">
                              <div className="font-medium">{e.exercise_name_zh}</div>
                              {e.notes && (
                                <div className="text-xs text-gray-400">{e.notes}</div>
                              )}
                            </td>
                            <td className="text-center">
                              {e.target_sets} × {e.target_reps_min}-{e.target_reps_max}
                            </td>
                            <td className="text-center">{e.target_rir ?? '-'}</td>
                            <td className="text-center">{e.rest_seconds}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {detailMeal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setDetailMeal(null)}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold">{detailMeal.name}</h2>
                <button
                  onClick={() => setDetailMeal(null)}
                  className="text-gray-500"
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                {detailMeal.meals.map((m) => (
                  <div key={m.order_index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">
                        #{m.order_index} · {MEAL_SLOT_LABEL[m.meal_slot] ?? m.meal_slot} ·{' '}
                        {m.target_time}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {m.target_kcal} kcal · {m.target_protein_g}P / {m.target_carbs_g}C /{' '}
                        {m.target_fat_g}F
                      </span>
                    </div>
                    {m.notes && <p className="text-xs text-gray-500 mb-2">{m.notes}</p>}
                    <ul className="text-sm space-y-1">
                      {m.ingredients.map((i, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{i.food_name_zh}</span>
                          <span className="text-gray-500">{i.grams} g</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Toasts：底部居中堆叠，无确认弹窗，主要操作后给"去激活 →"快速跳转 */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 space-y-2 z-50">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="bg-gray-900 text-white text-sm rounded-lg shadow-lg px-4 py-2 flex items-center gap-3"
            >
              <span>{t.text}</span>
              {t.actionHref && t.actionLabel && (
                <button
                  className="text-primary-300 underline"
                  onClick={() => router.push(t.actionHref!)}
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </RootLayout>
  );
}
