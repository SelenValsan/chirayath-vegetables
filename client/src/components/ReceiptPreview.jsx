import React from 'react';
import { Leaf } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';

export default function ReceiptPreview({ receipt }) {
  const s = receipt.snapshot;
  const isEntry = receipt.type === 'entry';

  return (
    <div id="receipt-print-area" className="bg-white text-text-main max-w-md mx-auto p-8 border border-border rounded-card">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-2">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold">{s.businessName || 'Chirayath Vegetables'}</h2>
        <p className="text-xs text-text-muted">{s.tagline || 'Dine with Nature'}</p>
      </div>

      <div className="flex justify-between text-sm mb-4 pb-4 border-b border-dashed border-border">
        <div>
          <p className="text-text-muted text-xs">Receipt No.</p>
          <p className="font-medium">{receipt.receiptNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-text-muted text-xs">Date</p>
          <p className="font-medium">{formatDate(s.date)}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-text-muted text-xs">Shop</p>
        <p className="font-medium">{s.shopName}</p>
        {s.shopPhone && <p className="text-xs text-text-muted">{s.shopPhone}</p>}
      </div>

      {isEntry ? (
        <>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted">
                <th className="text-left py-1.5">Product</th>
                <th className="text-right py-1.5">Qty</th>
                <th className="text-right py-1.5">Rate</th>
                <th className="text-right py-1.5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {s.items?.map((item, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1.5">{item.productName}</td>
                  <td className="text-right py-1.5">{item.quantity} {item.unit}</td>
                  <td className="text-right py-1.5">{formatCurrency(item.rate)}</td>
                  <td className="text-right py-1.5">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Subtotal</span><span>{formatCurrency(s.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Previous Balance</span><span>{formatCurrency(s.previousBalance)}</span></div>
            {s.discount > 0 && <div className="flex justify-between"><span className="text-text-muted">Discount</span><span>- {formatCurrency(s.discount)}</span></div>}
            {s.additionalCharges > 0 && <div className="flex justify-between"><span className="text-text-muted">Additional Charges</span><span>+ {formatCurrency(s.additionalCharges)}</span></div>}
            <div className="flex justify-between pt-1.5 border-t border-border font-semibold"><span>Grand Total</span><span>{formatCurrency(s.grandTotal)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Amount Paid</span><span>{formatCurrency(s.amountPaid)}</span></div>
            <div className="flex justify-between pt-1.5 border-t border-border font-semibold"><span>Remaining Balance</span><span>{formatCurrency(s.remainingBalance)}</span></div>
          </div>
        </>
      ) : (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Balance Before</span><span>{formatCurrency(s.balanceBefore)}</span></div>
          <div className="flex justify-between font-semibold"><span>Amount Received</span><span>{formatCurrency(s.amount)}</span></div>
          <div className="flex justify-between text-text-muted text-xs"><span>Method</span><span>{s.paymentMethod}</span></div>
          {s.referenceNumber && <div className="flex justify-between text-text-muted text-xs"><span>Reference</span><span>{s.referenceNumber}</span></div>}
          <div className="flex justify-between pt-1.5 border-t border-border font-semibold"><span>Balance After</span><span>{formatCurrency(s.balanceAfter)}</span></div>
        </div>
      )}

      <p className="text-center text-xs text-text-muted mt-6 pt-4 border-t border-dashed border-border">Thank you for your business.</p>
    </div>
  );
}
