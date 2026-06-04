/**
 * Calculate NovaNode platform fee: 1% of order total, capped at 5.00
 * (based on 500 max billable amount)
 */
export function calculatePlatformFee(orderTotal: number): number {
  const billable = Math.min(orderTotal, 500)
  return Math.round(billable * 0.01 * 100) / 100
}