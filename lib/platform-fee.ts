/**
 * Calculate NovaNode platform fee: 1% of order total, capped at 15.00
 * (based on 1500 max billable amount)
 */
export function calculatePlatformFee(orderTotal: number): number {
  const billable = Math.min(orderTotal, 1500)
  return Math.round(billable * 0.01 * 100) / 100
}