'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RootLayout } from '@/components/common/RootLayout';
import { apiClient } from '@/lib/api-client';
import type { DailySummary, CaloriesTrendPoint, NutritionAnalysis, ExpenseAnalysis } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316'];

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [todayStr] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(todayStr);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [caloriesTrend, setCaloriesTrend] = useState<CaloriesTrendPoint[]>([]);
  const [nutrition, setNutrition] = useState<NutritionAnalysis | null>(null);
  const [expenseAnalysis, setExpenseAnalysis] = useState<ExpenseAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadAll();
  }, [isAuthenticated, startDate, endDate]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [summary, trend, nut, exp] = await Promise.all([
        apiClient.get<any>('/analytics/daily-summary', { date: todayStr }),
        apiClient.get<any>('/analytics/calories-trend', { start_date: startDate, end_date: endDate }),
        apiClient.get<any>('/analytics/nutrition-analysis', { start_date: startDate, end_date: endDate }),
        apiClient.get<any>('/analytics/expense-analysis', { start_date: startDate, end_date: endDate }),
      ]);
      setDailySummary(summary);
      setCaloriesTrend(trend?.trend || []);
      setNutrition(nut);
      setExpenseAnalysis(exp);
    } catch (e) { /* error handled */ }
    setLoading(false);
  };

  const nutritionPieData = nutrition ? [
    { name: '蛋白质', value: nutrition.totals.protein * 4 },
    { name: '碳水', value: nutrition.totals.carbs * 4 },
    { name: '脂肪', value: nutrition.totals.fat * 9 },
  ] : [];

  const expenseBarData = expenseAnalysis ? Object.entries(expenseAnalysis.by_category).map(([k, v]) => ({
    name: k, amount: Number(v.amount),
  })) : [];

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

        {loading ? (
          <p className="text-gray-500 text-center py-12">加载中...</p>
        ) : (
          <>
            {/* Today's Summary */}
            {dailySummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                  <div className="text-2xl font-bold text-primary-600">{dailySummary.total_calories}</div>
                  <p className="text-sm text-gray-600 mt-1">今日摄入 (千卡)</p>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-green-600">{dailySummary.total_calories_burned}</div>
                  <p className="text-sm text-gray-600 mt-1">今日消耗 (千卡)</p>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-warning-600">{dailySummary.total_protein}g</div>
                  <p className="text-sm text-gray-600 mt-1">蛋白质</p>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-danger-600">¥{dailySummary.total_expenses}</div>
                  <p className="text-sm text-gray-600 mt-1">今日消费</p>
                </div>
              </div>
            )}

            {/* Calories Trend */}
            <div className="card">
              <h3 className="font-bold text-lg mb-4">热量趋势</h3>
              {caloriesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={caloriesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="calories_in" stroke="#0ea5e9" name="摄入" strokeWidth={2} />
                    <Line type="monotone" dataKey="calories_out" stroke="#ef4444" name="消耗" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">暂无热量数据</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nutrition Pie */}
              <div className="card">
                <h3 className="font-bold text-lg mb-4">营养分析（热量来源）</h3>
                {nutrition && (nutrition.totals.protein > 0 || nutrition.totals.carbs > 0 || nutrition.totals.fat > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={nutritionPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} ${Math.round(value)}千卡`}>
                        {nutritionPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${Math.round(v)} 千卡`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">暂无营养数据</p>
                )}
              </div>

              {/* Expense Bar */}
              <div className="card">
                <h3 className="font-bold text-lg mb-4">消费分析（按类别）</h3>
                {expenseBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={expenseBarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => `¥${v.toFixed(2)}`} />
                      <Bar dataKey="amount" fill="#0ea5e9" name="金额" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">暂无消费数据</p>
                )}
              </div>
            </div>

            {/* Meal Type Breakdown */}
            {nutrition?.by_meal_type && Object.keys(nutrition.by_meal_type).length > 0 && (
              <div className="card">
                <h3 className="font-bold text-lg mb-4">按餐食类型分布</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(nutrition.by_meal_type).map(([type, data]) => (
                    <div key={type} className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="font-semibold">{type}</div>
                      <div className="text-sm text-gray-500 mt-2">{data.calories} 千卡</div>
                      <div className="text-xs text-gray-400">P: {data.protein}g C: {data.carbs}g F: {data.fat}g</div>
                      <div className="text-xs text-gray-400">{data.count} 条记录</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expense Summary */}
            {expenseAnalysis && expenseAnalysis.total_amount > 0 && (
              <div className="card text-center">
                <p className="text-gray-600">
                  在 {startDate} 至 {endDate} 期间，共消费
                  <span className="text-xl font-bold text-warning-600 mx-2">¥{Number(expenseAnalysis.total_amount).toFixed(2)}</span>
                  ({expenseAnalysis.transaction_count} 笔交易)
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </RootLayout>
  );
}
