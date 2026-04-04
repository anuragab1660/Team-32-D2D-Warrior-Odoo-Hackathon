'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { EyeIcon, EyeOffIcon, LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AuthPanel } from '@/components/shared/AuthPanel'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const router = useRouter()
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
      await api.post('/api/auth/signup', {
        name: data.name,
        email: data.email,
        password: data.password,
      })
      toast.success('Account created! You can now log in.')
      router.push('/login')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPanel
      eyebrow="Create account"
      title="Create an account"
      description="Get started with ProsubX today."
      footer={
        <p className="text-center text-sm" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: '#17457d' }}>
            Sign in
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
            htmlFor="name"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
          >
            Full Name
          </label>
          <input
            id="name"
            placeholder="John Doe"
            {...register('name')}
            className="input-soft w-full"
            style={errors.name ? { outlineColor: '#dc2626' } : {}}
          />
          {errors.name && (
            <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>
              {errors.name.message}
            </p>
          )}
        </div>

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
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
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

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            {...register('confirmPassword')}
            className="input-soft w-full"
            style={errors.confirmPassword ? { outlineColor: '#dc2626' } : {}}
          />
          {errors.confirmPassword && (
            <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>
              {errors.confirmPassword.message}
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
              Creating account...
            </>
          ) : 'Create Account'}
        </button>
      </form>
    </AuthPanel>
  )
}
