'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useProducts } from '@/hooks/useProducts'
import { useTaxes } from '@/hooks/useTaxes'
import { useDiscounts } from '@/hooks/useDiscounts'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeftIcon, LoaderIcon, ImageIcon, XIcon } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  product_type: z.enum(['service', 'physical', 'digital', 'other']),
  description: z.string().optional(),
  sales_price: z.coerce.number().min(0, 'Must be >= 0'),
  yearly_price: z.coerce.number().min(0, 'Must be >= 0').optional(),
  cost_price: z.coerce.number().min(0, 'Must be >= 0'),
  category: z.string().optional(),
  hsn_sac_code: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function NewProductPage() {
  const router = useRouter()
  const { createProduct } = useProducts()
  const { taxes, fetchTaxes } = useTaxes()
  const { discounts, fetchDiscounts } = useDiscounts()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [taxId, setTaxId] = useState<string>('__none__')
  const [discountId, setDiscountId] = useState<string>('__none__')
  const [isActive, setIsActive] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchTaxes(true)
    fetchDiscounts(true)
  }, [fetchTaxes, fetchDiscounts])

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { product_type: 'service', sales_price: 0, cost_price: 0 },
  })

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await api.post<{ success: boolean; url: string }>('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImageUrl(data.url)
      toast.success('Image uploaded successfully')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setImageUploading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError('')
    try {
      const product = await createProduct({
        ...data,
        yearly_price: data.yearly_price ?? undefined,
        image_url: imageUrl || undefined,
        tax_id: taxId === '__none__' ? undefined : taxId || undefined,
        default_discount_id: discountId === '__none__' ? undefined : discountId || undefined,
        is_active: isActive,
      })
      if (product) {
        toast.success('Product created!')
        router.push(`/products/${product.id}`)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error || 'Failed to create product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="space-y-6 max-w-2xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="New Product"
        description="Add a new product to your catalog"
        action={
          <Link href="/products">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeftIcon className="h-4 w-4" />Back
            </Button>
          </Link>
        }
      />

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Product Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="flex items-center gap-4">
                <div
                  className="h-24 w-24 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imageUploading ? (
                    <LoaderIcon className="h-6 w-6 animate-spin text-indigo-500" />
                  ) : imageUrl ? (
                    <Image src={imageUrl} alt="Product" width={96} height={96} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}>
                    {imageUploading ? 'Uploading...' : 'Choose Image'}
                  </Button>
                  {imageUrl && (
                    <Button type="button" variant="ghost" size="sm" className="gap-1 text-red-500 hover:text-red-700 h-7" onClick={() => { setImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                      <XIcon className="h-3.5 w-3.5" />Remove
                    </Button>
                  )}
                  <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
              <Input id="name" placeholder="e.g. Premium Subscription" {...register('name')} className={errors.name ? 'border-red-400' : ''} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Product Type <span className="text-red-500">*</span></Label>
              <Select defaultValue="service" onValueChange={(v) => setValue('product_type', v as FormData['product_type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category + HSN */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g. Software" {...register('category')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hsn_sac_code">HSN / SAC Code</Label>
                <Input id="hsn_sac_code" placeholder="e.g. 998314" {...register('hsn_sac_code')} />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Optional product description" rows={3} {...register('description')} />
            </div>

            {/* Prices */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Subscription Pricing</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sales_price">
                    Monthly Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input id="sales_price" type="number" step="0.01" placeholder="e.g. 999" {...register('sales_price')} className={errors.sales_price ? 'border-red-400' : ''} />
                  {errors.sales_price && <p className="text-xs text-red-500">{errors.sales_price.message}</p>}
                  <p className="text-xs text-slate-400">Charged per month</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearly_price">
                    Yearly Price (₹)
                    <span className="ml-1.5 text-xs font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Recommended</span>
                  </Label>
                  <Input id="yearly_price" type="number" step="0.01" placeholder="e.g. 9999" {...register('yearly_price')} className={errors.yearly_price ? 'border-red-400' : ''} />
                  {errors.yearly_price && <p className="text-xs text-red-500">{errors.yearly_price.message}</p>}
                  <p className="text-xs text-slate-400">Charged per year — leave blank to auto-calculate (10× monthly)</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price (₹) <span className="text-red-500">*</span></Label>
                <Input id="cost_price" type="number" step="0.01" placeholder="e.g. 500" {...register('cost_price')} className={errors.cost_price ? 'border-red-400' : ''} />
                {errors.cost_price && <p className="text-xs text-red-500">{errors.cost_price.message}</p>}
              </div>
            </div>

            {/* Tax */}
            <div className="space-y-2">
              <Label>Default Tax</Label>
              <Select value={taxId} onValueChange={setTaxId}>
                <SelectTrigger><SelectValue placeholder="Select tax (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Tax</SelectItem>
                  {taxes.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name} — {t.rate}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label>Default Discount</Label>
              <Select value={discountId} onValueChange={setDiscountId}>
                <SelectTrigger><SelectValue placeholder="Select discount (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Discount</SelectItem>
                  {discounts.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name} — {d.type === 'percentage' ? `${d.value}%` : `₹${d.value}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Active</p>
                <p className="text-xs text-slate-500">Product is visible and can be added to subscriptions</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading || imageUploading}>
                {isLoading ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Product'}
              </Button>
              <Link href="/products">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
