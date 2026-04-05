import { toast } from 'sonner'

interface RazorpayOptions {
  order_id: string
  amount: number
  currency: string
  prefill?: { name?: string; email?: string; contact?: string }
  onSuccess: (data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) => void
  onError?: (error: unknown) => void
}

export function openRazorpayCheckout({ order_id, amount, currency, prefill, onSuccess, onError }: RazorpayOptions): void {
  const script = document.createElement('script')
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  script.async = true
  script.onload = () => {
    const rzp = new (window as any).Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount,
      currency,
      order_id,
      prefill: prefill || {},
      theme: { color: '#6366F1' },
      handler: onSuccess,
      modal: { ondismiss: () => toast.info('Payment cancelled') },
    })
    rzp.open()
    rzp.on('payment.failed', (response: any) => {
      toast.error('Payment failed: ' + response.error.description)
      onError?.(response.error)
    })
  }
  script.onerror = () => toast.error('Failed to load payment gateway')
  document.body.appendChild(script)
}

interface CardPaymentOptions {
  order_id: string
  amount: number
  currency: string
  card_number: string
  card_name: string
  card_expiry_month: string
  card_expiry_year: string
  card_cvv: string
  email?: string
  contact?: string
  onSuccess: (data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) => void
  onError?: (error: unknown) => void
}

// Loads razorpay.js (Custom Checkout SDK — supports createPayment)
function loadRazorpayCustomScript(): Promise<void> {
  const CUSTOM_SRC = 'https://checkout.razorpay.com/v1/razorpay.js'
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CUSTOM_SRC}"]`)
    if (existing) {
      if ((window as any).Razorpay?.prototype?.createPayment !== undefined || existing.dataset.loaded) {
        resolve(); return
      }
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay Custom SDK')))
      return
    }
    const script = document.createElement('script')
    script.src = CUSTOM_SRC
    script.async = true
    script.onload = () => { script.dataset.loaded = '1'; resolve() }
    script.onerror = () => reject(new Error('Failed to load Razorpay Custom SDK'))
    document.body.appendChild(script)
  })
}

export async function processCardPayment({
  order_id, amount, currency,
  card_number, card_name, card_expiry_month, card_expiry_year, card_cvv,
  email, contact,
  onSuccess, onError,
}: CardPaymentOptions): Promise<void> {
  try {
    await loadRazorpayCustomScript()

    const rzp = new (window as any).Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })

    rzp.createPayment({
      amount,
      currency,
      order_id,
      email: email || 'customer@example.com',
      contact: contact || '9999999999',
      method: 'card',
      'card[number]': card_number.replace(/\s/g, ''),
      'card[name]': card_name,
      'card[expiry_month]': card_expiry_month,
      'card[expiry_year]': card_expiry_year,
      'card[cvv]': card_cvv,
    })

    rzp.on('payment.success', (resp: any) => {
      onSuccess({
        razorpay_order_id: resp.razorpay_order_id,
        razorpay_payment_id: resp.razorpay_payment_id,
        razorpay_signature: resp.razorpay_signature,
      })
    })

    rzp.on('payment.error', (resp: any) => {
      toast.error('Payment failed: ' + (resp?.error?.description || 'Unknown error'))
      onError?.(resp?.error)
    })
  } catch (err) {
    toast.error((err as Error).message || 'Failed to load payment gateway')
    onError?.(err)
  }
}
