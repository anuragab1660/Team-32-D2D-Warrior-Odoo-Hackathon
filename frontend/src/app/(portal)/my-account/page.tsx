'use client'

import { useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserIcon, LockIcon, LoaderIcon, CheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function MyAccountPage() {
  const { user } = useAuthStore()

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    address: '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [savingPassword, setSavingPassword] = useState(false)

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      await api.put('/api/auth/profile', { name: profile.name, phone: profile.phone, address: profile.address })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwords.newPass !== passwords.confirm) {
      toast.error("New passwords don't match")
      return
    }
    if (passwords.newPass.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    try {
      await api.post('/api/auth/change-password', {
        current_password: passwords.current,
        new_password: passwords.newPass,
      })
      toast.success('Password changed successfully')
      setPasswords({ current: '', newPass: '', confirm: '' })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e?.response?.data?.error || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
        <p className="text-slate-500 mt-1">Manage your profile and security settings</p>
      </div>

      {/* Profile */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-base">Profile Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="bg-slate-50 text-slate-400" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={profile.address}
                onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                placeholder="Your address"
              />
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {savingProfile
              ? <><LoaderIcon className="h-4 w-4 animate-spin" />Saving...</>
              : <><CheckIcon className="h-4 w-4" />Save Profile</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <LockIcon className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-base">Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={passwords.current}
              onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
              placeholder="Enter current password"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwords.newPass}
                onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !passwords.current || !passwords.newPass || !passwords.confirm}
            variant="outline"
            className="gap-2"
          >
            {savingPassword
              ? <><LoaderIcon className="h-4 w-4 animate-spin" />Changing...</>
              : <><LockIcon className="h-4 w-4" />Change Password</>
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
