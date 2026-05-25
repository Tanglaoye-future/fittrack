'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function RootLayout({ children, showNav = true }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showNav && user && (
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-xl font-bold text-primary-600">
                💪 FitFlow
              </Link>

              <div className="hidden md:flex space-x-8">
                <Link href="/meals" className="text-gray-700 hover:text-primary-600">
                  饮食
                </Link>
                <Link href="/workouts" className="text-gray-700 hover:text-primary-600">
                  训练
                </Link>
                <Link href="/expenses" className="text-gray-700 hover:text-primary-600">
                  消费
                </Link>
                <Link href="/body-records" className="text-gray-700 hover:text-primary-600">
                  身体
                </Link>
                <Link href="/analytics" className="text-gray-700 hover:text-primary-600">
                  分析
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <Link href="/profile" className="text-sm text-gray-600 hover:text-primary-600">{user?.username}</Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-danger-600 hover:text-danger-700"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
