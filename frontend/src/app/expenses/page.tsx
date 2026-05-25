'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RootLayout } from '@/components/common/RootLayout';
import { apiClient } from '@/lib/api-client';
import type { Expense, PaginatedResponse } from '@/types';

const CATEGORY_MAP: Record<string, string> = {
  FOOD: '饮食', GYM: '健身', SUPPLEMENTS: '补剂', EQUIPMENT: '装备', APPAREL: '服饰', OTHER: '其他',
};

export default function ExpensesPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    category: 'FOOD',
    amount: '',
    currency: 'CNY',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadExpenses();
    loadStats();
  }, [isAuthenticated, page, category, startDate, endDate]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (category) params.category = category;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await apiClient.get<PaginatedResponse<Expense>>('/expenses', params);
      setExpenses(res.data);
      setTotal(res.total);
    } catch (e) { /* error handled */ }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await apiClient.get<any>('/expenses/stats', params);
      setStats(res);
    } catch (e) { /* error handled */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/expenses', { ...form, amount: Number(form.amount) });
      setShowModal(false);
      loadExpenses();
      loadStats();
    } catch (e) { /* error handled */ }
  };

  const totalPages = Math.ceil(total / 10);

  if (!isAuthenticated) return null;

  return (
    <RootLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">消费管理</h1>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">+ 添加消费</button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-warning-600">¥{Number(stats.total_amount).toFixed(2)}</div>
              <p className="text-sm text-gray-600 mt-1">总消费</p>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.total_count}</div>
              <p className="text-sm text-gray-600 mt-1">交易笔数</p>
            </div>
            {stats.categories?.length > 0 && (
              <div className="md:col-span-2 card">
                <h3 className="font-semibold mb-3">分类统计</h3>
                <div className="space-y-2">
                  {stats.categories.map((c: any) => (
                    <div key={c.category} className="flex justify-between items-center">
                      <span className="text-sm">{CATEGORY_MAP[c.category] || c.category}</span>
                      <span className="text-sm font-semibold">¥{Number(c.amount).toFixed(2)} ({c.count}笔)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="card flex flex-wrap gap-4">
          <div>
            <label className="label">类别</label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input">
              <option value="">全部</option>
              {Object.entries(CATEGORY_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">开始日期</label>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="input" />
          </div>
          <div>
            <label className="label">结束日期</label>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="input" />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-gray-500 text-center py-8">加载中...</p>
        ) : expenses.length === 0 ? (
          <div className="card text-center text-gray-500 py-8">暂无消费记录，点击上方按钮添加</div>
        ) : (
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div key={exp.id} className="card flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">{CATEGORY_MAP[exp.category] || exp.category}</span>
                    <span className="font-semibold text-lg">¥{Number(exp.amount).toFixed(2)}</span>
                  </div>
                  {exp.description && <div className="text-sm text-gray-500 mt-1">{exp.description}</div>}
                  <div className="text-xs text-gray-400 mt-1">{exp.expense_date?.split('T')[0]}</div>
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">添加消费</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">类别</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">金额 *</label>
                  <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="label">描述</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="月会费..." />
                </div>
                <div>
                  <label className="label">日期</label>
                  <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="input" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn btn-primary flex-1">添加</button>
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
