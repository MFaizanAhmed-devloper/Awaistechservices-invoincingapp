import { LineItem } from "./storage";

export function calculateLineItemTotals(item: LineItem) {
  const subtotal = item.quantity * item.rate;
  const discountAmount = subtotal * (item.discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (item.taxPercent / 100);
  const net = taxableAmount + taxAmount;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    net
  };
}

export function calculateInvoiceTotals(items: LineItem[]) {
  return items.reduce((acc, item) => {
    const totals = calculateLineItemTotals(item);
    return {
      subtotal: acc.subtotal + totals.subtotal,
      discountAmount: acc.discountAmount + totals.discountAmount,
      taxAmount: acc.taxAmount + totals.taxAmount,
      total: acc.total + totals.net
    };
  }, { subtotal: 0, discountAmount: 0, taxAmount: 0, total: 0 });
}

export function formatCurrency(amount: number, currency: string = "AUD") {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
