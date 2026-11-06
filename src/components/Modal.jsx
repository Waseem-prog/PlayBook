import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Field, Textarea } from './ui';

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const width = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[90vh] w-full ${width} flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="btn-ghost -mr-2 p-1.5" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}

// Approve / hold / reject with an optional note to the submitter.
export function ReviewDialog({ open, itemName, decision, busy, onSubmit, onClose }) {
  const [note, setNote] = useState('');
  useEffect(() => setNote(''), [open]);
  const labels = { approved: 'Approve', on_hold: 'Put on hold', rejected: 'Reject' };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${labels[decision] || 'Review'}: ${itemName || ''}`}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className={decision === 'rejected' ? 'btn-danger' : 'btn-primary'} disabled={busy} onClick={() => onSubmit(note)}>
            {labels[decision]}
          </button>
        </>
      }
    >
      <Field label="Note to submitter (optional)" hint="Shown to the student on their team, match or tournament page.">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={decision === 'approved' ? 'Good luck!' : 'Reason for this decision'} />
      </Field>
    </Modal>
  );
}
