'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { RootLayout } from '@/components/common/RootLayout';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuthStore();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.username, formData.password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
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
            <h2 className="text-2xl font-bold mb-6">注册</h2>

            {error && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">邮箱</label>
                <input
                  type="email"
                  name="email"
                  className="input"
                  placeholder="请输入邮箱"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="label">用户名</label>
                <input
                  type="text"
                  name="username"
                  className="input"
                  placeholder="请输入用户名（至少3个字符）"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="label">密码</label>
                <input
                  type="password"
                  name="password"
                  className="input"
                  placeholder="请输入密码（至少6个字符）"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="label">确认密码</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="input"
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '注册中...' : '注册'}
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              <p className="text-gray-600">
                已有账户？
                <Link href="/login" className="text-primary-600 hover:text-primary-700 ml-1">
                  立即登录
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
