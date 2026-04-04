export type UserRole = 'admin' | 'internal' | 'portal'
export type BillingPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type SubscriptionStatus = 'draft' | 'quotation' | 'confirmed' | 'active' | 'closed'
export type InvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled'
export type PaymentStatus = 'pending' | 'success' | 'failed'
export type PaymentMethod = 'razorpay' | 'bank_transfer' | 'cash' | 'other'
export type DiscountType = 'fixed' | 'percentage'
export type TaxType = 'percentage' | 'fixed'
export type ProductType = 'service' | 'physical' | 'digital' | 'other'

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message?: string
  data: T[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export interface ApiError {
  success: false
  error: string
  details?: Array<{ field: string; message: string }>
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  is_email_verified?: boolean
  created_at?: string
  customer_id?: string
  company_name?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  gstin?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface Customer {
  id: string
  user_id: string
  company_name?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  gstin?: string
  name?: string
  email?: string
}

export interface ProductVariant {
  id: string
  product_id: string
  attribute: string
  value: string
  extra_price: number
  is_active: boolean
}

export interface Product {
  id: string
  name: string
  product_type: ProductType
  description?: string
  sales_price: number
  cost_price: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  variants?: ProductVariant[]
  variants_count?: number
}

export interface Tax {
  id: string
  name: string
  type: TaxType
  rate: number
  description?: string
  is_active: boolean
  created_at: string
}

export interface Discount {
  id: string
  name: string
  type: DiscountType
  value: number
  min_purchase?: number
  min_quantity?: number
  start_date?: string
  end_date?: string
  usage_limit?: number
  usage_count: number
  applies_to_products: boolean
  applies_to_subscriptions: boolean
  is_active: boolean
  created_at: string
}

export interface RecurringPlan {
  id: string
  name: string
  price: number
  billing_period: BillingPeriod
  min_quantity: number
  start_date?: string
  end_date?: string
  auto_close: boolean
  closable: boolean
  pausable: boolean
  renewable: boolean
  is_active: boolean
  created_at: string
}

export interface QuotationTemplateLine {
  id: string
  template_id: string
  product_id: string
  quantity: number
  unit_price: number
  product?: Product
}

export interface QuotationTemplate {
  id: string
  name: string
  validity_days: number
  recurring_plan_id?: string
  is_active: boolean
  created_at: string
  plan?: RecurringPlan
  lines?: QuotationTemplateLine[]
}

export interface SubscriptionLine {
  id: string
  subscription_id: string
  product_id: string
  variant_id?: string
  discount_id?: string
  quantity: number
  unit_price: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  product?: Product
  variant?: ProductVariant
  discount?: Discount
  taxes?: Tax[]
}

export interface Subscription {
  id: string
  subscription_number: string
  customer_id: string
  plan_id?: string
  template_id?: string
  start_date: string
  expiration_date?: string
  payment_terms?: string
  status: SubscriptionStatus
  notes?: string
  created_at: string
  updated_at?: string
  customer?: Customer
  plan?: RecurringPlan
  template?: QuotationTemplate
  lines?: SubscriptionLine[]
}

export interface InvoiceLine {
  id: string
  invoice_id: string
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  tax_amount: number
  discount_amount: number
  line_total: number
}

export interface Invoice {
  id: string
  invoice_number: string
  subscription_id: string
  customer_id: string
  status: InvoiceStatus
  subtotal: number
  tax_total: number
  discount_total: number
  grand_total: number
  due_date?: string
  issued_date: string
  notes?: string
  created_at: string
  customer?: Customer
  subscription?: Subscription
  lines?: InvoiceLine[]
}

export interface InvoicePaymentStatus {
  amount_paid: number
  amount_outstanding: number
}

export interface Payment {
  id: string
  invoice_id: string
  customer_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  status: PaymentStatus
  razorpay_order_id?: string
  razorpay_payment_id?: string
  reference_number?: string
  notes?: string
  created_at: string
  invoice?: Invoice
  customer?: Customer
}

export interface RazorpayOrder {
  order_id: string
  amount: number
  currency: string
}

export interface DashboardMetrics {
  active_subscriptions: number
  monthly_revenue: number
  overdue_invoices: number
  pending_payments: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  count?: number
}

export interface OverdueInvoice {
  invoice_number: string
  customer_name: string
  due_date: string
  days_overdue: number
  amount: number
}

export interface PendingInvitation {
  id: string
  user_id: string
  email: string
  name?: string
  invited_by: string
  expires_at: string
  is_expired: boolean
  status: string
}

export interface CartItem {
  product_id: string
  variant_id?: string
  plan_id?: string
  quantity: number
  product_name: string
  variant_name?: string
  unit_price: number
}
