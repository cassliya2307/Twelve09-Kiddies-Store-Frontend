'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function LoginContent() {
  const { login, register, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/shop';
  const mode = searchParams.get('mode');

  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2" aria-label="Twelve09 Kiddies Store Home">
          <svg className="h-10 w-10 text-green-600" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="16" cy="16" r="14" stroke="#16A34A" strokeWidth="2"/>
            <path d="M16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24C20.4183 24 24 20.4183 24 16C24 11.5817 20.4183 8 16 8Z" stroke="#16A34A" strokeWidth="2"/>
            <circle cx="16" cy="16" r="4" fill="#16A34A"/>
          </svg>
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="mt-2 text-cream-600">{isLogin ? 'Sign in to your account' : 'Join Twelve09 Kiddies Store'}</p>
      </div>

      <div className="bg-white rounded-2xl border border-cream-200 p-6 sm:p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                required={!isLogin}
                disabled={submitting || authLoading}
                className="w-full px-4 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                autoComplete="name"
                placeholder="Enter your name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={submitting || authLoading}
              className="w-full px-4 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              autoComplete="email"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={submitting || authLoading}
              className="w-full px-4 py-2.5 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder="Enter your password"
            />
          </div>

          {error && !submitting && (
            <div className="text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={submitting || authLoading}
            loading={submitting}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-cream-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'} {' '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-green-600 hover:text-green-700 font-medium"
              disabled={submitting || authLoading}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/shop" className="text-green-600 hover:text-green-700 font-medium">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}