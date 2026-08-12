import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react';
import * as receiptService from '../services/receiptService';
import Button from '../components/Button';
import ReceiptPreview from '../components/ReceiptPreview';

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    receiptService.getReceipt(id).then(setReceipt).catch((err) => toast.error(err.message || 'Failed to load receipt')).finally(() => setLoading(false));
  }, [id]);

  const handleDownload = () => {
    const printContents = document.getElementById('receipt-print-area').outerHTML;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>${receipt.receiptNumber}</title>
      <style>body{font-family:Poppins,Arial,sans-serif;padding:24px;} table{width:100%;border-collapse:collapse;}</style>
      </head><body>${printContents}</body></html>`);
    win.document.close();
    win.print();
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  if (!receipt) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate('/receipts')} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-main">
          <ArrowLeft className="w-4 h-4" /> Back to Receipts
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
          <Button icon={Download} onClick={handleDownload}>Download</Button>
        </div>
      </div>

      <ReceiptPreview receipt={receipt} />
    </div>
  );
}
