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
