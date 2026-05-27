/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RootLayout } from '@/components/common/RootLayout';
import { apiClient } from '@/lib/api-client';
import type { Meal, PaginatedResponse } from '@/types';

const MEAL_TYPES: Record<string, string> = {
  BREAKFAST: '早餐',
  LUNCH: '午餐',
  DINNER: '晚餐',
  SNACK: '加餐',
};

export default function MealsPage() {
  const { isAuthenticated, hydrated } = useAuthStore();
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [date, setDate] = useState('');
  const [mealType, setMealType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [form, setForm] = useState({
    meal_type: 'BREAKFAST',
    food_name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    portion_size: '',
    meal_date: new Date().toISOString().split('T')[0],
    meal_time: '',
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    loadMeals();
  }, [hydrated, isAuthenticated, page, date, mealType]);

  const loadMeals = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 10 };
      if (date) params.date = date;
      if (mealType) params.meal_type = mealType;
      const res = await apiClient.get<PaginatedResponse<Meal>>('/meals', params);
      setMeals(res.data);
      setTotal(res.total);
    } catch (e: any) { setError(e.message || '加载失败'); }
    setLoading(false);
  };

  const openCreate = () => {
    setEditingMeal(null);
    setForm({ meal_type: 'BREAKFAST', food_name: '', calories: '', protein: '', carbs: '', fat: '', portion_size: '', meal_date: new Date().toISOString().split('T')[0], meal_time: '' });
    setShowModal(true);
  };

  const openEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setForm({
      meal_type: meal.meal_type,
      food_name: meal.food_name,
      calories: meal.calories?.toString() || '',
      protein: meal.protein?.toString() || '',
      carbs: meal.carbs?.toString() || '',
      fat: meal.fat?.toString() || '',
      portion_size: meal.portion_size || '',
      meal_date: meal.meal_date?.split('T')[0] || '',
      meal_time: meal.meal_time || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      calories: form.calories ? Number(form.calories) : undefined,
      protein: form.protein ? Number(form.protein) : undefined,
      carbs: form.carbs ? Number(form.carbs) : undefined,
      fat: form.fat ? Number(form.fat) : undefined,
    };
    try {
      if (editingMeal) {
        await apiClient.patch(`/meals/${editingMeal.id}`, payload);
      } else {
        await apiClient.post('/meals', payload);
      }
      setShowModal(false);
      loadMeals();
    } catch (e: any) { setError(e.message || '提交失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      await apiClient.delete(`/meals/${id}`);
      loadMeals();
    } catch (e: any) { setError(e.message || '删除失败'); }
  };

  const totalPages = Math.ceil(total / 10);

  if (!hydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <RootLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">饮食管理</h1>
          <button onClick={openCreate} className="btn btn-primary">+ 添加饮食</button>
        </div>

        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 text-sm text-danger-700">{error}</div>
        )}

        {/* Filters */}
        <div className="card flex flex-wrap gap-4">
          <div>
            <label className="label">日期</label>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} className="input" />
          </div>
          <div>
            <label className="label">餐食类型</label>
            <select value={mealType} onChange={(e) => { setMealType(e.target.value); setPage(1); }} className="input">
              <option value="">全部</option>
              {Object.entries(MEAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-gray-500 text-center py-8">加载中...</p>
        ) : meals.length === 0 ? (
          <div className="card text-center text-gray-500 py-8">暂无饮食记录，点击上方按钮添加</div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => (
              <div key={meal.id} className="card flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs rounded bg-primary-100 text-primary-700">{MEAL_TYPES[meal.meal_type] || meal.meal_type}</span>
                    <span className="font-semibold">{meal.food_name}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {meal.calories && <span>🔥 {meal.calories}千卡 </span>}
                    {meal.protein && <span>🥩 {meal.protein}g </span>}
                    {meal.carbs && <span>🌾 {meal.carbs}g </span>}
                    {meal.fat && <span>🧈 {meal.fat}g </span>}
                    {meal.portion_size && <span>· {meal.portion_size}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{meal.meal_date?.split('T')[0]}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(meal)} className="text-sm text-primary-600">编辑</button>
                  <button onClick={() => handleDelete(meal.id)} className="text-sm text-danger-600">删除</button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary text-sm">上一页</button>
                <span className="px-4 py-2 text-sm text-gray-600">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary text-sm">下一页</button>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">{editingMeal ? '编辑饮食' : '添加饮食'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">餐食类型</label>
                  <select value={form.meal_type} onChange={(e) => setForm({ ...form, meal_type: e.target.value })} className="input">
                    {Object.entries(MEAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">食物名称 *</label>
                  <input required value={form.food_name} onChange={(e) => setForm({ ...form, food_name: e.target.value })} className="input" placeholder="如：鸡胸肉" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">热量 (千卡)</label>
                    <input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">蛋白质 (g)</label>
                    <input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">碳水 (g)</label>
                    <input type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">脂肪 (g)</label>
                    <input type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">份量</label>
                    <input value={form.portion_size} onChange={(e) => setForm({ ...form, portion_size: e.target.value })} className="input" placeholder="如：200g" />
                  </div>
                  <div>
                    <label className="label">日期</label>
                    <input type="date" value={form.meal_date} onChange={(e) => setForm({ ...form, meal_date: e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">时间</label>
                  <input type="time" value={form.meal_time} onChange={(e) => setForm({ ...form, meal_time: e.target.value })} className="input" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn btn-primary flex-1">{editingMeal ? '保存' : '添加'}</button>
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
