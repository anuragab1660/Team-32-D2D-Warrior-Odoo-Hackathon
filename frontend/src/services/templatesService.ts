import api from '@/lib/api'
import type { QuotationTemplate, QuotationTemplateLine, PaginatedResponse, ApiResponse } from '@/types'

export const templatesService = {
  getTemplates() {
    return api.get<PaginatedResponse<QuotationTemplate>>('/api/templates')
  },

  createTemplate(payload: Partial<QuotationTemplate>) {
    return api.post<ApiResponse<QuotationTemplate>>('/api/templates', payload)
  },

  updateTemplate(id: string, payload: Partial<QuotationTemplate>) {
    return api.put<ApiResponse<QuotationTemplate>>(`/api/templates/${id}`, payload)
  },

  addLine(templateId: string, payload: Partial<QuotationTemplateLine>) {
    return api.post<ApiResponse<QuotationTemplateLine>>(`/api/templates/${templateId}/lines`, payload)
  },

  updateLine(templateId: string, lineId: string, payload: Partial<QuotationTemplateLine>) {
    return api.put<ApiResponse<QuotationTemplateLine>>(`/api/templates/${templateId}/lines/${lineId}`, payload)
  },

  deleteLine(templateId: string, lineId: string) {
    return api.delete<ApiResponse<unknown>>(`/api/templates/${templateId}/lines/${lineId}`)
  },
}
