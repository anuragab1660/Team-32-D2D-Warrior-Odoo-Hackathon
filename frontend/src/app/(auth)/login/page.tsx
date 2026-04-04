'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { EyeIcon, EyeOffIcon, LoaderIcon } from 'lucide-react'
import { AuthPanel } from '@/components/shared/AuthPanel'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError('')
    try {
      await login(data.email, data.password)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPanel
      eyebrow="Sign in"
      title="Welcome back"
      description="Sign in to your account to continue."
      footer={
        <p className="text-center text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold" style={{ color: '#17457d' }}>
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontFamily: 'Inter, sans-serif' }}
          >
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            className="input-soft w-full"
            style={errors.email ? { outlineColor: '#dc2626' } : {}}
          />
          {errors.email && (
            <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium"
              style={{ color: '#274e82', fontFamily: 'Inter, sans-serif' }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className="input-soft w-full pr-10"
              style={errors.password ? { outlineColor: '#dc2626' } : {}}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--on-surface-muted)' }}
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-gradient w-full flex items-center justify-center gap-2"
          style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          {isLoading ? (
            <>
              <LoaderIcon className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : 'Sign In'}
        </button>
      </form>
    </AuthPanel>
  )
}
