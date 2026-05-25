'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RootLayout } from '@/components/common/RootLayout';
import { apiClient } from '@/lib/api-client';
import type { Workout, PaginatedResponse } from '@/types';

const WORKOUT_TYPES: Record<string, string> = {
  CARDIO: '有氧',
  STRENGTH: '力量',
  FLEXIBILITY: '柔韧',
  SPORTS: '运动',
  OTHER: '其他',
};

const INTENSITY_MAP: Record<string, string> = { LOW: '低', MEDIUM: '中', HIGH: '高' };

export default function WorkoutsPage() {
  const { isAuthenticated, hydrated } = useAuthStore();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [date, setDate] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [form, setForm] = useState({
    workout_type: 'STRENGTH',
    exercise_name: '',
    duration_minutes: '',
    calories_burned: '',
    intensity: '',
    sets: '',
    reps: '',
    weight: '',
    notes: '',
    workout_date: new Date().toISOString().split('T')[0],
    workout_time: '',
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    loadWorkouts();
  }, [hydrated, isAuthenticated, page, date, workoutType]);

  const loadWorkouts = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 10 };
      if (date) params.date = date;
      if (workoutType) params.workout_type = workoutType;
      const res = await apiClient.get<PaginatedResponse<Workout>>('/workouts', params);
      setWorkouts(res.data);
      setTotal(res.total);
    } catch (e: any) { setError(e.message || '加载失败'); }
    setLoading(false);
  };

  const openCreate = () => {
    setEditingWorkout(null);
    setForm({ workout_type: 'STRENGTH', exercise_name: '', duration_minutes: '', calories_burned: '', intensity: '', sets: '', reps: '', weight: '', notes: '', workout_date: new Date().toISOString().split('T')[0], workout_time: '' });
    setShowModal(true);
  };

  const openEdit = (w: Workout) => {
    setEditingWorkout(w);
    setForm({
      workout_type: w.workout_type,
      exercise_name: w.exercise_name,
      duration_minutes: w.duration_minutes?.toString() || '',
      calories_burned: w.calories_burned?.toString() || '',
      intensity: w.intensity || '',
      sets: w.sets?.toString() || '',
      reps: w.reps?.toString() || '',
      weight: w.weight?.toString() || '',
      notes: w.notes || '',
      workout_date: w.workout_date?.split('T')[0] || '',
      workout_time: w.workout_time || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload: any = {
      ...form,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
      calories_burned: form.calories_burned ? Number(form.calories_burned) : undefined,
      sets: form.sets ? Number(form.sets) : undefined,
      reps: form.reps ? Number(form.reps) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
    };
    if (!form.intensity) delete payload.intensity;
    try {
      if (editingWorkout) {
        await apiClient.patch(`/workouts/${editingWorkout.id}`, payload);
      } else {
        await apiClient.post('/workouts', payload);
      }
      setShowModal(false);
      loadWorkouts();
    } catch (e: any) { setError(e.message || '提交失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      await apiClient.delete(`/workouts/${id}`);
      loadWorkouts();
    } catch (e: any) { setError(e.message || '删除失败'); }
  };

  const totalPages = Math.ceil(total / 10);

  if (!hydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <RootLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">训练管理</h1>
          <button onClick={openCreate} className="btn btn-primary">+ 添加训练</button>
        </div>

        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 text-sm text-danger-700">{error}</div>
        )}

        <div className="card flex flex-wrap gap-4">
          <div>
            <label className="label">日期</label>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} className="input" />
          </div>
          <div>
            <label className="label">训练类型</label>
            <select value={workoutType} onChange={(e) => { setWorkoutType(e.target.value); setPage(1); }} className="input">
              <option value="">全部</option>
              {Object.entries(WORKOUT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-8">加载中...</p>
        ) : workouts.length === 0 ? (
          <div className="card text-center text-gray-500 py-8">暂无训练记录，点击上方按钮添加</div>
        ) : (
          <div className="space-y-3">
            {workouts.map((w) => (
              <div key={w.id} className="card flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">{WORKOUT_TYPES[w.workout_type] || w.workout_type}</span>
                    <span className="font-semibold">{w.exercise_name}</span>
                    {w.intensity && <span className="text-xs text-gray-500">{INTENSITY_MAP[w.intensity] || w.intensity}强度</span>}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {w.duration_minutes && <span>⏱ {w.duration_minutes}分钟 </span>}
                    {w.calories_burned && <span>🔥 {w.calories_burned}千卡 </span>}
                    {w.sets && <span>· {w.sets}组 </span>}
                    {w.reps && <span>× {w.reps}次 </span>}
                    {w.weight && <span>· {w.weight}kg</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{w.workout_date?.split('T')[0]}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(w)} className="text-sm text-primary-600">编辑</button>
                  <button onClick={() => handleDelete(w.id)} className="text-sm text-danger-600">删除</button>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary text-sm">上一页</button>
                <span className="px-4 py-2 text-sm text-gray-600">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary text-sm">下一页</button>
              </div>
            )}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">{editingWorkout ? '编辑训练' : '添加训练'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">训练类型</label>
                  <select value={form.workout_type} onChange={(e) => setForm({ ...form, workout_type: e.target.value })} className="input">
                    {Object.entries(WORKOUT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">训练项目 *</label>
                  <input required value={form.exercise_name} onChange={(e) => setForm({ ...form, exercise_name: e.target.value })} className="input" placeholder="如：卧推" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">时长 (分钟)</label>
                    <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">消耗热量</label>
                    <input type="number" value={form.calories_burned} onChange={(e) => setForm({ ...form, calories_burned: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">强度</label>
                    <select value={form.intensity} onChange={(e) => setForm({ ...form, intensity: e.target.value })} className="input">
                      <option value="">不指定</option>
                      <option value="LOW">低</option>
                      <option value="MEDIUM">中</option>
                      <option value="HIGH">高</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">重量 (kg)</label>
                    <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">组数</label>
                    <input type="number" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">每组次数</label>
                    <input type="number" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">日期</label>
                    <input type="date" value={form.workout_date} onChange={(e) => setForm({ ...form, workout_date: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">时间</label>
                    <input type="time" value={form.workout_time} onChange={(e) => setForm({ ...form, workout_time: e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">备注</label>
                  <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" placeholder="训练感想..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn btn-primary flex-1">{editingWorkout ? '保存' : '添加'}</button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">取消</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RootLayout>
  );
}
