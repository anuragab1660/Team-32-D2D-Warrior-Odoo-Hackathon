import { useState, useCallback } from 'react'
import api, { handleApiError } from '@/lib/api'
import type { QuotationTemplate, QuotationTemplateLine, PaginatedResponse, ApiResponse } from '@/types'
import { toast } from 'sonner'

export function useTemplates() {
  const [templates, setTemplates] = useState<QuotationTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<PaginatedResponse<QuotationTemplate>>('/api/templates')
      setTemplates(data.data)
    } catch (err) { handleApiError(err) }
    finally { setLoading(false) }
  }, [])

  const createTemplate = useCallback(async (payload: Partial<QuotationTemplate>) => {
    const { data } = await api.post<ApiResponse<QuotationTemplate>>('/api/templates', payload)
    toast.success(data.message || 'Template created')
    return data.data
  }, [])

  const updateTemplate = useCallback(async (id: string, payload: Partial<QuotationTemplate>) => {
    const { data } = await api.put<ApiResponse<QuotationTemplate>>(`/api/templates/${id}`, payload)
    toast.success(data.message || 'Template updated')
    return data.data
  }, [])

  const addLine = useCallback(async (templateId: string, payload: Partial<QuotationTemplateLine>) => {
    const { data } = await api.post<ApiResponse<QuotationTemplateLine>>(`/api/templates/${templateId}/lines`, payload)
    toast.success(data.message || 'Line added')
    return data.data
  }, [])

  const updateLine = useCallback(async (templateId: string, lineId: string, payload: Partial<QuotationTemplateLine>) => {
    const { data } = await api.put<ApiResponse<QuotationTemplateLine>>(`/api/templates/${templateId}/lines/${lineId}`, payload)
    toast.success(data.message || 'Line updated')
    return data.data
  }, [])

  const deleteLine = useCallback(async (templateId: string, lineId: string) => {
    await api.delete(`/api/templates/${templateId}/lines/${lineId}`)
    toast.success('Line deleted')
  }, [])

  return { templates, loading, fetchTemplates, createTemplate, updateTemplate, addLine, updateLine, deleteLine }
}
