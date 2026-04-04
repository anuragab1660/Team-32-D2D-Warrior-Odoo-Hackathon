'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { CheckCircleIcon, XCircleIcon, LoaderIcon, MailIcon } from 'lucide-react'
import { AuthPanel } from '@/components/shared/AuthPanel'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
      <AuthPanel eyebrow="Verification" title="Verifying your email..." description="Hang tight while we confirm your address.">
        <div className="flex justify-center py-6">
          <LoaderIcon className="h-12 w-12 animate-spin" style={{ color: '#17457d' }} />
        </div>
      </AuthPanel>
    )

    if (status === 'success') return (
      <AuthPanel
        eyebrow="Verification complete"
        title="Email verified!"
        description="Your email has been verified. Redirecting to login..."
        footer={
          <Link href="/login">
            <Button className="btn-gradient">Go to Login</Button>
          </Link>
        }
        className="text-center"
      >
        <CheckCircleIcon className="h-12 w-12 mx-auto mb-4" style={{ color: '#10b981' }} />
      </AuthPanel>
    )

    if (status === 'error') return (
      <AuthPanel
        eyebrow="Verification failed"
        title="Verification failed"
        description={error}
        footer={
          <Link href="/login">
            <Button variant="outline" className="btn-soft">Back to Login</Button>
          </Link>
        }
        className="text-center"
      >
        <XCircleIcon className="h-12 w-12 mx-auto mb-4" style={{ color: '#dc2626' }} />
      </AuthPanel>
    )

    return (
      <AuthPanel
        eyebrow="Email verification"
        title="Check your inbox"
        description="We sent a verification link to your email address. Click the link to verify your account."
        footer={
          <Link href="/login">
            <Button variant="outline" className="btn-soft">Back to Login</Button>
          </Link>
        }
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          <MailIcon className="h-12 w-12" style={{ color: '#17457d' }} />
        </div>
      </AuthPanel>
    )
  
        eyebrow="Verification complete"
        title="Email verified!"
        description="Your email has been verified. Redirecting to login..."
        footer={
          <Link href="/login">
            <Button className="btn-gradient">Go to Login</Button>
          </Link>
        }
        className="text-center"
      >
        <CheckCircleIcon className="h-12 w-12 mx-auto mb-4" style={{ color: '#10b981' }} />
      </AuthPanel>
    )
  }

  if (status === 'error') {
    return (
      <AuthPanel
        eyebrow="Verification failed"
        title="Verification failed"
        description={error}
        footer={
          <Link href="/login">
            <Button variant="outline" className="btn-soft">Back to Login</Button>
          </Link>
        }
        className="text-center"
      >
        <XCircleIcon className="h-12 w-12 mx-auto mb-4" style={{ color: '#dc2626' }} />
      </AuthPanel>
    )
  }
>>>>>>> Stashed changes

  return (
<<<<<<< Updated upstream
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
=======
    <AuthPanel
      eyebrow="Email verification"
      title="Check your inbox"
      description="We sent a verification link to your email address. Click the link to verify your account."
      footer={
        <Link href="/login">
          <Button variant="outline" className="btn-soft">Back to Login</Button>
        </Link>
      }
      className="text-center"
    >
      <div className="flex justify-center mb-4">
        <MailIcon className="h-12 w-12" style={{ color: '#17457d' }} />
      </div>
    </AuthPanel>
>>>>>>> Stashed changes
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
