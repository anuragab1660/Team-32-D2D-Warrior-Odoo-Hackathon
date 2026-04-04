'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircleIcon, XCircleIcon, LoaderIcon, MailIcon } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error' | 'waiting'>('waiting')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('waiting'); return }
    const verify = async () => {
      setStatus('verifying')
      try {
        await api.get(`/api/auth/verify-email?token=${token}`)
        setStatus('success')
        setTimeout(() => router.push('/login'), 3000)
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } }
        setError(e?.response?.data?.error || 'Verification failed')
        setStatus('error')
      }
    }
    verify()
  }, [token, router])

  if (status === 'verifying') return (
    <Card className="shadow-lg border-slate-200">
      <CardContent className="pt-8 pb-8 text-center">
        <LoaderIcon className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Verifying your email...</h2>
      </CardContent>
    </Card>
  )

  if (status === 'success') return (
    <Card className="shadow-lg border-slate-200">
      <CardContent className="pt-8 pb-8 text-center">
        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Email verified!</h2>
        <p className="text-sm text-slate-500 mb-6">Your email has been verified. Redirecting to login...</p>
        <Link href="/login"><Button className="bg-indigo-600 hover:bg-indigo-700">Go to Login</Button></Link>
      </CardContent>
    </Card>
  )

  if (status === 'error') return (
    <Card className="shadow-lg border-slate-200">
      <CardContent className="pt-8 pb-8 text-center">
        <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Verification failed</h2>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <Link href="/login"><Button variant="outline">Back to Login</Button></Link>
      </CardContent>
    </Card>
  )

  return (
    <Card className="shadow-lg border-slate-200">
      <CardContent className="pt-8 pb-8 text-center">
        <div className="flex justify-center mb-4">
          <MailIcon className="h-12 w-12 text-indigo-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>
        <p className="text-sm text-slate-500 mb-6">
          We sent a verification link to your email address. Click the link to verify your account.
        </p>
        <Link href="/login"><Button variant="outline">Back to Login</Button></Link>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
