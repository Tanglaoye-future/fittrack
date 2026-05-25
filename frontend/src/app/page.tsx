'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RootLayout } from '@/components/common/RootLayout';

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <RootLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 欢迎卡片 */}
        <div className="md:col-span-3 card">
          <h1 className="text-2xl font-bold mb-2">👋 欢迎，{user?.username}！</h1>
          <p className="text-gray-600">
            今天是开始健身数据记录的好日子，让我们记录下这一刻的进度。
          </p>
        </div>

        {/* 快速导航卡片 */}
        <a
          href="/meals"
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="text-3xl mb-2">🍽️</div>
          <h3 className="font-bold text-lg mb-1">今日饮食</h3>
          <p className="text-sm text-gray-600">记录今天的饮食和热量摄入</p>
        </a>

        <a
          href="/workouts"
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="text-3xl mb-2">💪</div>
          <h3 className="font-bold text-lg mb-1">训练记录</h3>
          <p className="text-sm text-gray-600">记录你的训练成果</p>
        </a>

        <a
          href="/expenses"
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-bold text-lg mb-1">消费统计</h3>
          <p className="text-sm text-gray-600">追踪你的健身投入</p>
        </a>

        <a
          href="/body-records"
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="text-3xl mb-2">📏</div>
          <h3 className="font-bold text-lg mb-1">身体数据</h3>
          <p className="text-sm text-gray-600">记录身体围度和体重变化</p>
        </a>

        {/* 统计信息 */}
        <div className="md:col-span-3 grid grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600">--</div>
            <p className="text-sm text-gray-600 mt-1">今日热量摄入</p>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600">--</div>
            <p className="text-sm text-gray-600 mt-1">今日训练时长</p>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600">--</div>
            <p className="text-sm text-gray-600 mt-1">今月消费</p>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="md:col-span-3 bg-primary-50 border border-primary-200 rounded-lg p-4">
          <p className="text-sm text-primary-900">
            💡 <strong>提示：</strong> 数据分析功能正在开发中，敬请期待！
          </p>
        </div>
      </div>
    </RootLayout>
  );
}
