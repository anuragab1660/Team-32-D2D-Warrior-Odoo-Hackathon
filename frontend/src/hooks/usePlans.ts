import { useState, useCallback } from 'react'
import type { RecurringPlan } from '@/types'
import { buildQueryString, requestData, withLoading } from './utils'
import { plansService } from '@/services'

export function usePlans() {
  const [plans, setPlans] = useState<RecurringPlan[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPlans = useCallback(async (active?: boolean) => {
    await withLoading(setLoading, async () => {
      const query = buildQueryString({ is_active: active })
      const data = await requestData(() => plansService.getPlans(query || undefined))
      setPlans(Array.isArray(data) ? data : [])
    })
  }, [])

  const createPlan = useCallback(async (payload: Partial<RecurringPlan>) => {
    return requestData(() => plansService.createPlan(payload), {
      successMessage: 'Plan created',
    })
  }, [])

  const updatePlan = useCallback(async (id: string, payload: Partial<RecurringPlan>) => {
    return requestData(() => plansService.updatePlan(id, payload), {
      successMessage: 'Plan updated',
    })
  }, [])

  const togglePlan = useCallback(async (id: string) => {
    return requestData(() => plansService.togglePlan(id), {
      successMessage: 'Plan updated',
    })
  }, [])

  const deletePlan = useCallback(async (id: string) => {
    await requestData(() => plansService.deletePlan(id), {
      successMessage: 'Plan deleted',
    })
  }, [])

  return { plans, loading, fetchPlans, createPlan, updatePlan, togglePlan, deletePlan }
}
