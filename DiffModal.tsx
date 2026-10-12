import React from 'react';
import { Check, X, Copy, Sparkles, ArrowRight } from 'lucide-react';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  proposedText: string;
  actionTitle: string;
  onApply: (newText: string) => void;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  isOpen,
  onClose,
  originalText,
  proposedText,
  actionTitle,
  onApply,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(proposedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApply(proposedText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1a17] border border-[#38332b] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#38332b] bg-[#171512]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-medium text-stone-100 flex items-center gap-2">
                Revisión propuesta por Claude
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-normal">
                  {actionTitle}
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Compara el original con la sugerencia antes de aplicar los cambios en tu manuscrito.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#141311]">
          {/* Original */}
          <div className="flex flex-col bg-[#1c1a17]/90 rounded-xl border border-stone-800/80 p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Tu texto original
              </span>
              <span className="text-xs text-stone-500">
                {originalText.trim().split(/\s+/).filter(Boolean).length} palabras
              </span>
            </div>
            <div className="flex-1 overflow-y-auto font-serif text-stone-300 text-sm leading-relaxed whitespace-pre-wrap select-text">
              {originalText || '(Texto no especificado)'}
            </div>
          </div>

          {/* Claude Proposal */}
          <div className="flex flex-col bg-[#1e1b16] rounded-xl border border-amber-500/30 p-4 relative shadow-inner">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-900/40">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Versión refinada de Claude
              </span>
              <span className="text-xs text-amber-300/70">
                {proposedText.trim().split(/\s+/).filter(Boolean).length} palabras
              </span>
            </div>
            <div className="flex-1 overflow-y-auto font-serif text-amber-50 text-sm leading-relaxed whitespace-pre-wrap select-text">
              {proposedText}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#38332b] bg-[#171512]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors"
          >
            Descartar sugerencia
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? '¡Copiado!' : 'Copiar texto'}
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              Reemplazar en manuscrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
