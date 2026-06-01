'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RootLayout } from '@/components/common/RootLayout';
import { analyticsClient } from '@/lib/api-client';
import type { DailySummary, MacroTrendPoint, BodyWeightPoint } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#eab308'];

const num = (v: string | number | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
};

const fmtDate = (s: string): string => s.slice(0, 10);

export default function AnalyticsPage() {
  const { isAuthenticated, hydrated } = useAuthStore();
  const router = useRouter();

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [macros, setMacros] = useState<MacroTrendPoint[]>([]);
  const [bodyWeight, setBodyWeight] = useState<BodyWeightPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated, startDate, endDate]);

  const loadAll = async () => {
    setLoading(true);
    setErrorMsg(null);
    const params = { date_from: startDate, date_to: endDate };
    const results = await Promise.allSettled([
      analyticsClient.get<DailySummary[]>('/analytics/daily-summary', params),
      analyticsClient.get<MacroTrendPoint[]>('/analytics/macros', params),
      analyticsClient.get<BodyWeightPoint[]>('/analytics/body-weight', params),
    ]);
    setSummaries(results[0].status === 'fulfilled' ? results[0].value ?? [] : []);
    setMacros(results[1].status === 'fulfilled' ? results[1].value ?? [] : []);
    setBodyWeight(results[2].status === 'fulfilled' ? results[2].value ?? [] : []);
    const failed = results.find((r) => r.status === 'rejected');
    if (failed && failed.status === 'rejected') {
      setErrorMsg(failed.reason instanceof Error ? failed.reason.message : '加载失败');
    }
    setLoading(false);
  };

  const latest = summaries[summaries.length - 1];
  const latestBw = bodyWeight[bodyWeight.length - 1];

  const macrosChart = macros.map((m) => ({
    date: fmtDate(m.date),
    kcal: Math.round(m.kcal),
    protein: Math.round(m.protein),
  }));

  const bwChart = bodyWeight.map((b) => ({
    date: fmtDate(b.measurement_date),
    weight: num(b.morning_weight_kg) || null,
    bf: num(b.body_fat_percentage) || null,
  }));

  const macroTotals = macros.reduce(
    (acc, m) => ({ p: acc.p + m.protein, c: acc.c + m.carbs, f: acc.f + m.fat }),
    { p: 0, c: 0, f: 0 },
  );
  const macroPieData = (macroTotals.p + macroTotals.c + macroTotals.f) > 0 ? [
    { name: '蛋白质', value: Math.round(macroTotals.p * 4) },
    { name: '碳水', value: Math.round(macroTotals.c * 4) },
    { name: '脂肪', value: Math.round(macroTotals.f * 9) },
  ] : [];

  if (!hydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <RootLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">数据分析</h1>
          <div className="flex gap-3">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input text-sm" />
            <span className="py-2 text-sm text-gray-500">至</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input text-sm" />
          </div>
        </div>

        {errorMsg && (
          <div className="card bg-red-50 border border-red-200 text-red-700 text-sm">
            分析服务调用失败：{errorMsg}（确认 Python 服务运行在 :3010）
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-12">加载中...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card text-center">
                <div className="text-2xl font-bold text-primary-600">{latest?.total_kcal ?? '--'}</div>
                <p className="text-sm text-gray-600 mt-1">最近一日热量 (千卡)</p>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-warning-600">{latest ? Math.round(num(latest.total_protein)) : '--'}g</div>
                <p className="text-sm text-gray-600 mt-1">最近一日蛋白质</p>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-green-600">{latest?.workout_minutes ?? '--'}</div>
                <p className="text-sm text-gray-600 mt-1">最近一日训练 (分钟)</p>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-danger-600">
                  {latest && num(latest.morning_weight_kg) ? num(latest.morning_weight_kg).toFixed(1) : latestBw && num(latestBw.morning_weight_kg) ? num(latestBw.morning_weight_kg).toFixed(1) : '--'}
                </div>
                <p className="text-sm text-gray-600 mt-1">最新晨重 (kg)</p>
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold text-lg mb-4">体重 + 体脂趋势</h3>
              {bwChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bwChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: 'kg', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: '%', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#0ea5e9" name="晨重 (kg)" strokeWidth={2} connectNulls />
                    <Line yAxisId="right" type="monotone" dataKey="bf" stroke="#ef4444" name="体脂 (%)" strokeWidth={2} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">区间内暂无体测数据</p>
              )}
            </div>

            <div className="card">
              <h3 className="font-bold text-lg mb-4">每日 Macros 趋势</h3>
              {macrosChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={macrosChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: 'kcal', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: 'g', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="kcal" stroke="#0ea5e9" name="热量 (kcal)" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="protein" stroke="#22c55e" name="蛋白质 (g)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">区间内暂无饮食数据</p>
              )}
            </div>

            <div className="card">
              <h3 className="font-bold text-lg mb-4">窗口期热量来源分布</h3>
              {macroPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={macroPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={({ name, value }) => `${name} ${value} 千卡`}
                    >
                      {macroPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v} 千卡`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">区间内暂无 Macros 数据</p>
              )}
            </div>
          </>
        )}
      </div>
    </RootLayout>
  );
}
