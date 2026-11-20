import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="w-full max-w-sm rounded-2xl bg-[#16121d] border border-[#faf6f0]/15 p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-rose-300 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#faf6f0]">{title}</h3>
                <p className="text-xs text-[#faf6f0]/70 mt-1 leading-relaxed">{description}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#faf6f0]/80 hover:bg-[#faf6f0]/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
