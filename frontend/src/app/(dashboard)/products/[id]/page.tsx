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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
        const api = (await import('@/lib/api')).default
        const { data } = await api.get(`/api/products/${id}`)
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
        <LoaderIcon className="h-8 w-8 animate-spin text-indigo-600" />
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
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeftIcon className="h-4 w-4" />Back
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleToggle}>
              {product.is_active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 border-red-200 hover:bg-red-50">
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <ActiveBadge isActive={product.is_active} />
        <span className="text-sm text-slate-500 capitalize">{product.product_type}</span>
      </div>

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Edit Product</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

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
                    {imageUploading ? 'Uploading...' : imageUrl ? 'Change Image' : 'Choose Image'}
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

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} className={errors.name ? 'border-red-400' : ''} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select defaultValue={product.product_type} onValueChange={(v) => setValue('product_type', v as FormData['product_type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sales_price">Sales Price (₹)</Label>
                <Input id="sales_price" type="number" step="0.01" {...register('sales_price')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price (₹)</Label>
                <Input id="cost_price" type="number" step="0.01" {...register('cost_price')} />
              </div>
            </div>

            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={saving || imageUploading}>
              {saving ? <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Variants</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {variants.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Attribute</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase py-2">Value</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase py-2">Extra Price</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {variants.map(v => (
                  <tr key={v.id} className="border-b border-slate-100">
                    <td className="py-2">{v.attribute}</td>
                    <td className="py-2">{v.value}</td>
                    <td className="py-2 text-right">₹{v.extra_price}</td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteVariant(v.id)} className="h-7 w-7 p-0 text-red-400 hover:text-red-600">
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-400">No variants added yet.</p>
          )}

          <div className="grid grid-cols-4 gap-2 items-end pt-2 border-t border-slate-100">
            <div>
              <Label className="text-xs mb-1 block">Attribute</Label>
              <Input placeholder="e.g. Color" value={newVariant.attribute} onChange={e => setNewVariant(p => ({ ...p, attribute: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Value</Label>
              <Input placeholder="e.g. Red" value={newVariant.value} onChange={e => setNewVariant(p => ({ ...p, value: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Extra Price (₹)</Label>
              <Input type="number" value={newVariant.extra_price} onChange={e => setNewVariant(p => ({ ...p, extra_price: e.target.value }))} />
            </div>
            <Button onClick={handleAddVariant} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <PlusIcon className="h-4 w-4" />Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
