export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseAmount(amountString: string): number {
  const cleaned = amountString
    .replace(/[₹$€£,]/g, '')
    .replace(/\s+/g, '')
    .trim();
  
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) {
    throw new Error(`Invalid amount format: ${amountString}`);
  }
  
  return parsed;
}
