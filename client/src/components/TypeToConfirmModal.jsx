import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function TypeToConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmWord,
  confirmLabel = 'Delete Permanently',
  loading = false,
}) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const matches = typed === confirmWord;

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-error-bg flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-error" />
        </div>
        <p className="text-sm text-text-secondary pt-2">{message}</p>
      </div>

      <label className="label-field">
        Type <span className="font-semibold text-text-main">{confirmWord}</span> to confirm
      </label>
      <input
        type="text"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="input-field"
        autoComplete="off"
        autoFocus
      />

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading} disabled={!matches}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
