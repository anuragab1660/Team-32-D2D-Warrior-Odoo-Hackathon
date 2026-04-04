'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { LoaderIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react'
import { AuthPanel } from '@/components/shared/AuthPanel'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError('')
    try {
      await api.post('/api/auth/forgot-password', { email: data.email })
      setSent(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthPanel
        eyebrow="Recovery email sent"
        title="Check your email"
        description="We&apos;ve sent a password reset link to your email address."
        footer={
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: '#17457d', fontFamily: 'Inter, sans-serif' }}
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Back to login
          </Link>
        }
        className="text-center"
      >
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(16,185,129,0.12)' }}
        >
          <CheckCircleIcon className="h-8 w-8" style={{ color: '#10b981' }} />
        </div>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel
      eyebrow="Account recovery"
      title="Forgot password?"
      description="Enter your email and we&apos;ll send you a reset link."
      footer={
        <p className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: '#17457d', fontFamily: 'Inter, sans-serif' }}
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
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

        <button
          type="submit"
          disabled={isLoading}
          className="btn-gradient w-full flex items-center justify-center gap-2"
          style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          {isLoading ? (
            <>
              <LoaderIcon className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : 'Send Reset Link'}
        </button>
      </form>
    </AuthPanel>
  )
}
