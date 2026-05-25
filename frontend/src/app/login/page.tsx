'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { RootLayout } from '@/components/common/RootLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请检查邮箱和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RootLayout showNav={false}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-600 mb-2">💪 FitFlow</h1>
            <p className="text-gray-600">健身饮食消费管理系统</p>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold mb-6">登录</h2>

            {error && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">邮箱或用户名</label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入邮箱或用户名"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="label">密码</label>
                <input
                  type="password"
                  className="input"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              <p className="text-gray-600">
                还没有账户？
                <Link href="/register" className="text-primary-600 hover:text-primary-700 ml-1">
                  立即注册
                </Link>
              </p>
            </div>

            {/* 测试账户提示 */}
            <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-xs text-primary-700">
              <p className="font-medium mb-1">📝 测试账户：</p>
              <p>邮箱: test@fitflow.com</p>
              <p>密码: test123456</p>
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
