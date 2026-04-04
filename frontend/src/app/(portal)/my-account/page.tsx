'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  UserIcon, LockIcon, LoaderIcon, CheckIcon, BuildingIcon,
  ShieldIcon, AlertTriangleIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'

/**
 * @module portal/my-account
 * @api-calls PUT /api/auth/profile, POST /api/auth/change-password, GET /api/auth/me
 * @depends-on useAuthStore
 * @role portal
 * @emits none
 * RUFLOW_REVIEW: account settings - personal info, business info, security, danger zone
 */

function passwordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { level: 1, label: 'Weak', color: 'bg-red-400' },
    { level: 2, label: 'Fair', color: 'bg-amber-400' },
    { level: 3, label: 'Good', color: 'bg-blue-400' },
    { level: 4, label: 'Strong', color: 'bg-green-500' },
  ]
  return map[score - 1] ?? { level: 0, label: '', color: '' }
}

export default function MyAccountPage() {
  /**
   * @module portal/my-account
   * @api-calls PUT /api/auth/profile, POST /api/auth/change-password
   * @depends-on useAuthStore
   * @role portal
   * @emits none
   * RUFLOW_REVIEW: 4-tab account settings page
   */
  const { user, refreshUser } = useAuthStore()

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  const [business, setBusiness] = useState({
    company_name: user?.company_name ?? '',
    gstin: user?.gstin ?? '',
    address: user?.address ?? '',
    city: user?.city ?? '',
    state: user?.state ?? '',
    country: user?.country ?? '',
    postal_code: user?.postal_code ?? '',
  })
  const [savingBusiness, setSavingBusiness] = useState(false)

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name ?? '', phone: user.phone ?? '', address: user.address ?? '' })
      setBusiness({
        company_name: user.company_name ?? '',
        gstin: user.gstin ?? '',
        address: user.address ?? '',
        city: user.city ?? '',
        state: user.state ?? '',
        country: user.country ?? '',
        postal_code: user.postal_code ?? '',
      })
    }
  }, [user])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      await api.put('/api/auth/profile', {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
      })
      await refreshUser()
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveBusiness = async () => {
    setSavingBusiness(true)
    try {
      await api.put('/api/auth/profile', {
        company_name: business.company_name,
        gstin: business.gstin,
        address: business.address,
        city: business.city,
        state: business.state,
        country: business.country,
        postal_code: business.postal_code,
      })
      toast.success('Business info updated')
    } catch {
      toast.error('Failed to update business info')
    } finally {
      setSavingBusiness(false)
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

  const pwStrength = passwordStrength(passwords.newPass)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
        <p className="text-slate-500 mt-1">Manage your profile and security settings</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
          {getInitials(user?.name ?? 'U')}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs capitalize mt-1">{user?.role}</Badge>
        </div>
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="personal" className="gap-1.5 text-xs sm:text-sm">
            <UserIcon className="h-3.5 w-3.5" />Personal
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-1.5 text-xs sm:text-sm">
            <BuildingIcon className="h-3.5 w-3.5" />Business
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm">
            <ShieldIcon className="h-3.5 w-3.5" />Security
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-1.5 text-xs sm:text-sm">
            <AlertTriangleIcon className="h-3.5 w-3.5" />Danger
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Personal Info */}
        <TabsContent value="personal">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-indigo-600" />Profile Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Input value={user?.email ?? ''} disabled className="bg-slate-50 text-slate-400" />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Phone Number</Label>
                  <Input
                    value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="capitalize">{user?.role} role</Badge>
                {user?.is_email_verified
                  ? <Badge className="bg-green-50 text-green-700 border-green-200 gap-1"><CheckIcon className="h-3 w-3" />Email verified</Badge>
                  : <Badge className="bg-amber-50 text-amber-700 border-amber-200">Email not verified</Badge>
                }
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
        </TabsContent>

        {/* Tab 2: Business Info */}
        <TabsContent value="business">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BuildingIcon className="h-4 w-4 text-indigo-600" />Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={business.company_name}
                    onChange={e => setBusiness(b => ({ ...b, company_name: e.target.value }))}
                    placeholder="Your company"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input
                    value={business.gstin}
                    onChange={e => setBusiness(b => ({ ...b, gstin: e.target.value }))}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Street Address</Label>
                  <Input
                    value={business.address}
                    onChange={e => setBusiness(b => ({ ...b, address: e.target.value }))}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={business.city}
                    onChange={e => setBusiness(b => ({ ...b, city: e.target.value }))}
                    placeholder="Mumbai"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={business.state}
                    onChange={e => setBusiness(b => ({ ...b, state: e.target.value }))}
                    placeholder="Maharashtra"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={business.country}
                    onChange={e => setBusiness(b => ({ ...b, country: e.target.value }))}
                    placeholder="India"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input
                    value={business.postal_code}
                    onChange={e => setBusiness(b => ({ ...b, postal_code: e.target.value }))}
                    placeholder="400001"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveBusiness}
                disabled={savingBusiness}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {savingBusiness
                  ? <><LoaderIcon className="h-4 w-4 animate-spin" />Saving...</>
                  : <><CheckIcon className="h-4 w-4" />Save Business Info</>
                }
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Security */}
        <TabsContent value="security">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <LockIcon className="h-4 w-4 text-indigo-600" />Change Password
              </CardTitle>
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
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwords.newPass}
                  onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                  placeholder="At least 8 characters"
                />
                {passwords.newPass && (
                  <div className="space-y-1">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full ${i <= pwStrength.level ? pwStrength.color : 'bg-slate-200'}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${pwStrength.level <= 1 ? 'text-red-500' : pwStrength.level <= 2 ? 'text-amber-500' : 'text-green-600'}`}>
                      {pwStrength.label}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Re-enter new password"
                />
                {passwords.confirm && passwords.newPass !== passwords.confirm && (
                  <p className="text-xs text-red-500">Passwords don&apos;t match</p>
                )}
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
        </TabsContent>

        {/* Tab 4: Danger Zone */}
        <TabsContent value="danger">
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-600">
                <AlertTriangleIcon className="h-4 w-4" />Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Delete Account</h3>
                <p className="text-xs text-red-600 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <AlertTriangleIcon className="h-4 w-4" />Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5" />Delete Account
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            To delete your account, please contact our support team at{' '}
            <a href="mailto:support@prosubx.com" className="text-indigo-600 underline">support@prosubx.com</a>.
            Our team will process your request within 48 hours.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
