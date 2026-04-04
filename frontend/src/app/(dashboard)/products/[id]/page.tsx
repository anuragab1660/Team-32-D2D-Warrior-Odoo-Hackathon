'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProducts } from '@/hooks/useProducts'
import { PageHeader } from '@/components/shared/PageHeader'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import type { Product, ProductVariant } from '@/types'
import { ArrowLeftIcon, LoaderIcon, PlusIcon, TrashIcon, ImageIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  product_type: z.enum(['service', 'physical', 'digital', 'other']),
  description: z.string().optional(),
  sales_price: z.coerce.number().min(0),
  cost_price: z.coerce.number().min(0),
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

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { updateProduct, toggleProduct, deleteProduct, getVariants, createVariant, deleteVariant } = useProducts()
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newVariant, setNewVariant] = useState({ attribute: '', value: '', extra_price: '0' })
  const [imageUrl, setImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const load = async () => {
      try {
        const apiLib = (await import('@/lib/api')).default
        const { data } = await apiLib.get(`/api/products/${id}`)
        const p: Product = data.data
        setProduct(p)
        setImageUrl(p.image_url || '')
        reset({
          name: p.name,
          product_type: p.product_type,
          description: p.description ?? '',
          sales_price: p.sales_price,
          cost_price: p.cost_price,
        })
        const v = await getVariants(id)
        setVariants(v)
      } catch {
        toast.error('Product not found')
        router.push('/products')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router, getVariants, reset])

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
    if (!product) return
    setSaving(true)
    try {
      const updated = await updateProduct(product.id, { ...data, image_url: imageUrl || undefined })
      setProduct(updated)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async () => {
    if (!product) return
    const updated = await toggleProduct(product.id)
    setProduct(updated)
  }

  const handleDelete = async () => {
    if (!product || !confirm('Delete this product?')) return
    await deleteProduct(product.id)
    router.push('/products')
  }

  const handleAddVariant = async () => {
    if (!product || !newVariant.attribute || !newVariant.value) return
    const v = await createVariant(product.id, {
      attribute: newVariant.attribute,
      value: newVariant.value,
      extra_price: parseFloat(newVariant.extra_price) || 0,
    })
    setVariants(prev => [...prev, v])
    setNewVariant({ attribute: '', value: '', extra_price: '0' })
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!product || !confirm('Delete this variant?')) return
    await deleteVariant(product.id, variantId)
    setVariants(prev => prev.filter(v => v.id !== variantId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoaderIcon className="h-8 w-8 animate-spin" style={{ color: '#274e82' }} />
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={product.name}
        description="Edit product details and variants"
        action={
          <div className="flex items-center gap-2">
            <Link href="/products">
              <button className="btn-soft flex items-center gap-2">
                <ArrowLeftIcon className="h-4 w-4" />Back
              </button>
            </Link>
            <button className="btn-soft" onClick={handleToggle}>
              {product.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              className="btn-soft flex items-center gap-1"
              onClick={handleDelete}
              style={{ color: '#dc2626' }}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <ActiveBadge isActive={product.is_active} />
        <span
          className="text-sm capitalize"
          style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface-muted)' }}
        >
          {product.product_type}
        </span>
      </div>

      {/* Edit form */}
      <div className="section-card">
        <h2
          className="text-sm font-bold mb-5"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
        >
          Edit Product
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Image Upload */}
          <div className="space-y-1.5">
            {fieldLabel('Product Image')}
            <div className="flex items-center gap-4 mt-1">
              <div
                className="h-24 w-24 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
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
                  {imageUploading ? 'Uploading...' : imageUrl ? 'Change Image' : 'Choose Image'}
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
                <p className="text-xs" style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>PNG, JPG up to 5MB</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <div className="space-y-1.5">
            {fieldLabel('Name')}
            <input id="name" {...register('name')} className="input-soft w-full" style={errors.name ? { outlineColor: '#dc2626' } : {}} />
            {errors.name && <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            {fieldLabel('Type')}
            <select
              className="input-soft w-full"
              defaultValue={product.product_type}
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
            <input id="description" {...register('description')} className="input-soft w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {fieldLabel('Sales Price (₹)')}
              <input id="sales_price" type="number" step="0.01" {...register('sales_price')} className="input-soft w-full" />
            </div>
            <div className="space-y-1.5">
              {fieldLabel('Cost Price (₹)')}
              <input id="cost_price" type="number" step="0.01" {...register('cost_price')} className="input-soft w-full" />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || imageUploading}
            className="btn-gradient flex items-center gap-2"
            style={{ opacity: (saving || imageUploading) ? 0.7 : 1 }}
          >
            {saving ? <><LoaderIcon className="h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Variants */}
      <div className="section-card">
        <h2
          className="text-sm font-bold mb-5"
          style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}
        >
          Variants
        </h2>

        {variants.length > 0 ? (
          <div className="rounded-xl overflow-hidden mb-4" style={{ background: 'var(--surface-container-low)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-container-high)' }}>
                  {['Attribute', 'Value', 'Extra Price', ''].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--on-surface-muted)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr
                    key={v.id}
                    style={{ background: i % 2 === 0 ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)' }}
                  >
                    <td className="px-4 py-3" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>{v.attribute}</td>
                    <td className="px-4 py-3" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--on-surface)' }}>{v.value}</td>
                    <td className="px-4 py-3" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, color: 'var(--on-surface)' }}>₹{v.extra_price}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteVariant(v.id)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                        style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', marginLeft: 'auto' }}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm mb-4" style={{ color: 'var(--on-surface-muted)', fontFamily: 'Inter, sans-serif' }}>
            No variants added yet.
          </p>
        )}

        <div
          className="grid grid-cols-4 gap-3 items-end pt-4"
          style={{ borderTop: 'none' }}
        >
          <div className="space-y-1.5">
            {fieldLabel('Attribute')}
            <input
              placeholder="e.g. Color"
              value={newVariant.attribute}
              onChange={e => setNewVariant(p => ({ ...p, attribute: e.target.value }))}
              className="input-soft w-full"
            />
          </div>
          <div className="space-y-1.5">
            {fieldLabel('Value')}
            <input
              placeholder="e.g. Red"
              value={newVariant.value}
              onChange={e => setNewVariant(p => ({ ...p, value: e.target.value }))}
              className="input-soft w-full"
            />
          </div>
          <div className="space-y-1.5">
            {fieldLabel('Extra Price (₹)')}
            <input
              type="number"
              value={newVariant.extra_price}
              onChange={e => setNewVariant(p => ({ ...p, extra_price: e.target.value }))}
              className="input-soft w-full"
            />
          </div>
          <button
            type="button"
            onClick={handleAddVariant}
            className="btn-gradient flex items-center justify-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />Add
          </button>
        </div>
      </div>
    </div>
  )
}
