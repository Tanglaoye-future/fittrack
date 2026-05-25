'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RootLayout } from '@/components/common/RootLayout';
import { apiClient } from '@/lib/api-client';
import type { BodyRecord, PaginatedResponse } from '@/types';

export default function BodyRecordsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [records, setRecords] = useState<BodyRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    weight: '',
    body_fat_percentage: '',
    muscle_mass: '',
    chest: '',
    waist: '',
    hip: '',
    arm: '',
    thigh: '',
    measurement_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadRecords();
  }, [isAuthenticated, page, startDate, endDate]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await apiClient.get<PaginatedResponse<BodyRecord>>('/body-records', params);
      setRecords(res.data);
      setTotal(res.total);
    } catch (e) { /* error handled */ }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { measurement_date: form.measurement_date };
    if (form.weight) payload.weight = Number(form.weight);
    if (form.body_fat_percentage) payload.body_fat_percentage = Number(form.body_fat_percentage);
    if (form.muscle_mass) payload.muscle_mass = Number(form.muscle_mass);
    if (form.chest) payload.chest = Number(form.chest);
    if (form.waist) payload.waist = Number(form.waist);
    if (form.hip) payload.hip = Number(form.hip);
    if (form.arm) payload.arm = Number(form.arm);
    if (form.thigh) payload.thigh = Number(form.thigh);
    try {
      await apiClient.post('/body-records', payload);
      setShowModal(false);
      loadRecords();
    } catch (e) { /* error handled */ }
  };

  const totalPages = Math.ceil(total / 10);

  if (!isAuthenticated) return null;

  return (
    <RootLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">身体数据</h1>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">+ 添加测量</button>
        </div>

        {/* Filters */}
        <div className="card flex flex-wrap gap-4">
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
        ) : records.length === 0 ? (
          <div className="card text-center text-gray-500 py-8">暂无身体数据，点击上方按钮添加</div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div key={r.id} className="card">
                <div className="text-xs text-gray-400 mb-2">{r.measurement_date?.split('T')[0]}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {r.weight && <div><span className="text-gray-500">体重:</span> {Number(r.weight).toFixed(1)} kg</div>}
                  {r.body_fat_percentage && <div><span className="text-gray-500">体脂:</span> {Number(r.body_fat_percentage).toFixed(1)}%</div>}
                  {r.muscle_mass && <div><span className="text-gray-500">肌肉量:</span> {Number(r.muscle_mass).toFixed(1)} kg</div>}
                  {r.chest && <div><span className="text-gray-500">胸围:</span> {Number(r.chest).toFixed(1)} cm</div>}
                  {r.waist && <div><span className="text-gray-500">腰围:</span> {Number(r.waist).toFixed(1)} cm</div>}
                  {r.hip && <div><span className="text-gray-500">臀围:</span> {Number(r.hip).toFixed(1)} cm</div>}
                  {r.arm && <div><span className="text-gray-500">臂围:</span> {Number(r.arm).toFixed(1)} cm</div>}
                  {r.thigh && <div><span className="text-gray-500">腿围:</span> {Number(r.thigh).toFixed(1)} cm</div>}
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
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">添加身体测量</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">体重 (kg)</label>
                    <input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">体脂率 (%)</label>
                    <input type="number" step="0.1" value={form.body_fat_percentage} onChange={(e) => setForm({ ...form, body_fat_percentage: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">肌肉量 (kg)</label>
                    <input type="number" step="0.1" value={form.muscle_mass} onChange={(e) => setForm({ ...form, muscle_mass: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">胸围 (cm)</label>
                    <input type="number" step="0.1" value={form.chest} onChange={(e) => setForm({ ...form, chest: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">腰围 (cm)</label>
                    <input type="number" step="0.1" value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">臀围 (cm)</label>
                    <input type="number" step="0.1" value={form.hip} onChange={(e) => setForm({ ...form, hip: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">臂围 (cm)</label>
                    <input type="number" step="0.1" value={form.arm} onChange={(e) => setForm({ ...form, arm: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">腿围 (cm)</label>
                    <input type="number" step="0.1" value={form.thigh} onChange={(e) => setForm({ ...form, thigh: e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">测量日期</label>
                  <input type="date" value={form.measurement_date} onChange={(e) => setForm({ ...form, measurement_date: e.target.value })} className="input" />
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
