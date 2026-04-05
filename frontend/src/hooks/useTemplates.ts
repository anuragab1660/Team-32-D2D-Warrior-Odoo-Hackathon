import { useState, useCallback } from 'react'
import type { QuotationTemplate, QuotationTemplateLine } from '@/types'
import { requestData, withLoading } from './utils'
import { templatesService } from '@/services'

export function useTemplates() {
  const [templates, setTemplates] = useState<QuotationTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTemplates = useCallback(async () => {
    await withLoading(setLoading, async () => {
      const data = await requestData(() => templatesService.getTemplates())
      if (!data) return
      setTemplates(data.data)
    })
  }, [])

  const createTemplate = useCallback(async (payload: Partial<QuotationTemplate>) => {
    return requestData(() => templatesService.createTemplate(payload), {
      successMessage: 'Template created',
    })
  }, [])

  const updateTemplate = useCallback(async (id: string, payload: Partial<QuotationTemplate>) => {
    return requestData(() => templatesService.updateTemplate(id, payload), {
      successMessage: 'Template updated',
    })
  }, [])

  const addLine = useCallback(async (templateId: string, payload: Partial<QuotationTemplateLine>) => {
    return requestData(() => templatesService.addLine(templateId, payload), { successMessage: 'Line added' })
  }, [])

  const updateLine = useCallback(async (templateId: string, lineId: string, payload: Partial<QuotationTemplateLine>) => {
    return requestData(() => templatesService.updateLine(templateId, lineId, payload), { successMessage: 'Line updated' })
  }, [])

  const deleteLine = useCallback(async (templateId: string, lineId: string) => {
    await requestData(() => templatesService.deleteLine(templateId, lineId), { successMessage: 'Line deleted' })
  }, [])

  return { templates, loading, fetchTemplates, createTemplate, updateTemplate, addLine, updateLine, deleteLine }
}
