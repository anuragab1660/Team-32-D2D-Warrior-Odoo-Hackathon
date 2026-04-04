'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { LoaderIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AuthPanel } from '@/components/shared/AuthPanel'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) { setError('Invalid reset link'); return }
    setIsLoading(true)
    setError('')
    try {
      await api.post('/api/auth/reset-password', { token, password: data.password })
      toast.success('Password reset successfully!')
      router.push('/login')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthPanel
      eyebrow="Secure reset"
      title="Reset password"
      description="Enter your new password below."
      footer={
        <p className="text-center">
          <Link href="/login" className="text-sm font-semibold" style={{ color: '#17457d', fontFamily: 'Inter, sans-serif' }}>
>>>>>>> Stashed changes
            Back to login
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
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
          >
            New Password
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
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter new password"
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
              Resetting...
            </>
          ) : 'Reset Password'}
        </button>
      </form>
    </AuthPanel>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
