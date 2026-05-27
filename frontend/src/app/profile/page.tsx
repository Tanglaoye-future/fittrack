/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RootLayout } from '@/components/common/RootLayout';
import { apiClient } from '@/lib/api-client';

export default function ProfilePage() {
  const { user, isAuthenticated, hydrated, getCurrentUser } = useAuthStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: '',
    gender: '',
    age: '',
    height: '',
    fitness_goal: '',
  });
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user) {
      setForm({
        username: user.username || '',
        gender: user.gender || '',
        age: user.age?.toString() || '',
        height: user.height?.toString() || '',
        fitness_goal: (user as any).fitness_goal || '',
      });
    }
    loadStats();
  }, [hydrated, isAuthenticated, user]);

  const loadStats = async () => {
    try {
      const stats = await apiClient.get<any>('/users/stats');
      setUserStats(stats);
    } catch (e: any) { /* stats error non-critical */ }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: any = {};
      if (form.username) payload.username = form.username;
      if (form.gender) payload.gender = form.gender;
      if (form.age) payload.age = Number(form.age);
      if (form.height) payload.height = Number(form.height);
      if (form.fitness_goal) payload.fitness_goal = form.fitness_goal;
      await apiClient.patch('/users/profile', payload);
      await getCurrentUser();
      setEditing(false);
    } catch (e: any) { setError(e.message || '保存失败'); }
    setSaving(false);
  };

  if (!hydrated) return null;
  if (!isAuthenticated || !user) return null;

  return (
    <RootLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">个人设置</h1>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn btn-primary">编辑资料</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? '保存中...' : '保存'}</button>
              <button onClick={() => setEditing(false)} className="btn btn-secondary">取消</button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 text-sm text-danger-700">{error}</div>
        )}

        {/* Stats */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <div className="text-xl font-bold text-primary-600">{userStats.total_meals}</div>
              <p className="text-sm text-gray-600 mt-1">饮食记录</p>
            </div>
            <div className="card text-center">
              <div className="text-xl font-bold text-green-600">{userStats.total_workouts}</div>
              <p className="text-sm text-gray-600 mt-1">训练记录</p>
            </div>
            <div className="card text-center">
              <div className="text-xl font-bold text-warning-600">¥{Number(userStats.total_expenses).toFixed(2)}</div>
              <p className="text-sm text-gray-600 mt-1">总消费</p>
            </div>
            <div className="card text-center">
              <div className="text-xl font-bold text-purple-600">{userStats.total_body_records}</div>
              <p className="text-sm text-gray-600 mt-1">身体数据</p>
            </div>
          </div>
        )}

        {/* Profile */}
        <div className="card max-w-lg">
          <h2 className="font-bold text-lg mb-4">基本信息</h2>
          <div className="space-y-4">
            <div>
              <label className="label">邮箱</label>
              <p className="text-gray-700">{user.email}</p>
            </div>
            <div>
              <label className="label">用户名</label>
              {editing ? (
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input" />
              ) : (
                <p className="text-gray-700">{user.username}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">性别</label>
                {editing ? (
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input">
                    <option value="">未设置</option>
                    <option value="MALE">男</option>
                    <option value="FEMALE">女</option>
                    <option value="OTHER">其他</option>
                  </select>
                ) : (
                  <p className="text-gray-700">{user.gender === 'MALE' ? '男' : user.gender === 'FEMALE' ? '女' : user.gender || '未设置'}</p>
                )}
              </div>
              <div>
                <label className="label">年龄</label>
                {editing ? (
                  <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="input" />
                ) : (
                  <p className="text-gray-700">{user.age || '未设置'}</p>
                )}
              </div>
              <div>
                <label className="label">身高 (cm)</label>
                {editing ? (
                  <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="input" />
                ) : (
                  <p className="text-gray-700">{user.height || '未设置'}</p>
                )}
              </div>
              <div>
                <label className="label">健身目标</label>
                {editing ? (
                  <select value={form.fitness_goal} onChange={(e) => setForm({ ...form, fitness_goal: e.target.value })} className="input">
                    <option value="">未设置</option>
                    <option value="GAIN_MUSCLE">增肌</option>
                    <option value="LOSE_FAT">减脂</option>
                    <option value="MAINTENANCE">维持</option>
                  </select>
                ) : (
                  <p className="text-gray-700">
                    {(user as any).fitness_goal === 'GAIN_MUSCLE' ? '增肌' : (user as any).fitness_goal === 'LOSE_FAT' ? '减脂' : (user as any).fitness_goal === 'MAINTENANCE' ? '维持' : '未设置'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
