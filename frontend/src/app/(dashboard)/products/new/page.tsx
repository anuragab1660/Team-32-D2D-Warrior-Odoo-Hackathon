'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProducts } from '@/hooks/useProducts'
import { PageHeader } from '@/components/shared/PageHeader'
import { ArrowLeftIcon, LoaderIcon, ImageIcon, XIcon } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  product_type: z.enum(['service', 'physical', 'digital', 'other']),
  description: z.string().optional(),
  sales_price: z.coerce.number().min(0, 'Must be >= 0'),
  cost_price: z.coerce.number().min(0, 'Must be >= 0'),
})

type FormData = z.infer<typeof schema>

const fieldLabel = (text: string) => (
  <span
    className="text-xs font-semibold uppercase tracking-wider"
    style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
  >
    {text}
  </span>
)

export default function NewProductPage() {
  const router = useRouter()
  const { createProduct } = useProducts()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const product = await createProduct({ ...data, image_url: imageUrl || undefined })
      router.push(`/products/${product.id}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error || 'Failed to create product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="New Product"
        description="Add a new product to your catalog"
        action={
          <Link href="/products">
            <button className="btn-soft flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" />Back
            </button>
          </Link>
        }
      />

      <div className="section-card">
        <h2
          className="text-sm font-bold mb-5"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
        >
          Product Details
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontFamily: 'Inter, sans-serif' }}
            >
              {error}
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-2">
            {fieldLabel('Product Image')}
            <div className="flex items-center gap-4 mt-1.5">
              <div
                className="h-24 w-24 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: 'var(--surface-container-low)' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imageUploading ? (
                  <LoaderIcon className="h-6 w-6 animate-spin" style={{ color: '#274e82' }} />
                ) : imageUrl ? (
                  <Image src={imageUrl} alt="Product" width={96} height={96} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8" style={{ color: 'var(--on-surface-muted)' }} />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="btn-soft text-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? 'Uploading...' : 'Choose Image'}
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm font-medium"
                    style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}
                    onClick={() => { setImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  >
                    <XIcon className="h-3.5 w-3.5" />Remove
                  </button>
                )}
                <p className="text-xs" style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>
                  PNG, JPG up to 5MB
                </p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <div className="space-y-1.5">
            {fieldLabel('Product Name')}
            <input
              id="name"
              placeholder="e.g. Premium Subscription"
              {...register('name')}
              className="input-soft w-full"
              style={errors.name ? { outlineColor: '#dc2626' } : {}}
            />
            {errors.name && (
              <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            {fieldLabel('Product Type')}
            <select
              className="input-soft w-full"
              defaultValue="service"
              onChange={(e) => setValue('product_type', e.target.value as FormData['product_type'])}
            >
              <option value="service">Service</option>
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            {fieldLabel('Description')}
            <input
              id="description"
              placeholder="Optional description"
              {...register('description')}
              className="input-soft w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {fieldLabel('Sales Price (₹)')}
              <input
                id="sales_price"
                type="number"
                step="0.01"
                {...register('sales_price')}
                className="input-soft w-full"
                style={errors.sales_price ? { outlineColor: '#dc2626' } : {}}
              />
              {errors.sales_price && (
                <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>{errors.sales_price.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              {fieldLabel('Cost Price (₹)')}
              <input
                id="cost_price"
                type="number"
                step="0.01"
                {...register('cost_price')}
                className="input-soft w-full"
                style={errors.cost_price ? { outlineColor: '#dc2626' } : {}}
              />
              {errors.cost_price && (
                <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>{errors.cost_price.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading || imageUploading}
              className="btn-gradient flex items-center gap-2"
              style={{ opacity: (isLoading || imageUploading) ? 0.7 : 1 }}
            >
              {isLoading ? <><LoaderIcon className="h-4 w-4 animate-spin" />Creating...</> : 'Create Product'}
            </button>
            <Link href="/products">
              <button type="button" className="btn-soft">Cancel</button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
