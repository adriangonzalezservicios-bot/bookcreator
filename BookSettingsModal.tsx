import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Save, Loader2, Gauge } from 'lucide-react';
import { Book } from '../types/book';
import { executeClaudeAction } from '../services/claudeApi';

interface BookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  onSave: (updatedBook: Book) => void;
}

export const BookSettingsModal: React.FC<BookSettingsModalProps> = ({
  isOpen,
  onClose,
  book,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: book.title,
    subtitle: book.subtitle || '',
    author: book.author,
    genre: book.genre,
    tone: book.tone,
    synopsis: book.synopsis,
    targetWords: book.targetWords || 50000,
  });

  const [isPolishing, setIsPolishing] = useState(false);

  React.useEffect(() => {
    setFormData({
      title: book.title,
      subtitle: book.subtitle || '',
      author: book.author,
      genre: book.genre,
      tone: book.tone,
      synopsis: book.synopsis,
      targetWords: book.targetWords || 50000,
    });
  }, [book, isOpen]);

  if (!isOpen) return null;

  const handlePolishSynopsis = async () => {
    setIsPolishing(true);
    try {
      const prompt = `Pule y haz irresistible la siguiente sinopsis / premisa editorial para una novela del género "${formData.genre}". Tono: "${formData.tone}".
Sinopsis actual:
"${formData.synopsis}"

Devuelve una versión de alto impacto narrativo (hook comercial y literario) que atrape a lectores y editores.`;
      const res = await executeClaudeAction('custom', prompt);
      setFormData((prev) => ({
        ...prev,
        synopsis: res.result.trim(),
      }));
    } catch (err: any) {
      alert(`Error con Claude: ${err.message}`);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...book,
      ...formData,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1a17] border border-[#38332b] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#38332b] bg-[#171512]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen className="w-4 h-4" />
            </span>
            <h3 className="text-base font-medium text-stone-100">
              Configuración y Ficha de la Obra
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Título de la obra *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Subtítulo o lema</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Ej. Una novela de misterio y niebla..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Nombre del autor / seudónimo</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Género literario</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="Ej. Thriller, Fantasía, Ensayo..."
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-amber-400" />
                Meta de palabras
              </label>
              <input
                type="number"
                step="1000"
                min="1000"
                value={formData.targetWords}
                onChange={(e) => setFormData({ ...formData, targetWords: parseInt(e.target.value, 10) || 50000 })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-300">Tono y Atmósfera deseada</label>
            <input
              type="text"
              value={formData.tone}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              placeholder="Ej. Introspectivo y poético con creciente tensión..."
              className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-stone-300">
                Sinopsis y Premisa Narrativa (usada como contexto por Claude)
              </label>
              <button
                type="button"
                onClick={handlePolishSynopsis}
                disabled={isPolishing || !formData.synopsis.trim()}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-colors disabled:opacity-50"
              >
                {isPolishing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Pulir con Claude...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Pulir sinopsis con Claude
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={6}
              value={formData.synopsis}
              onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
              placeholder="Describe el conflicto central, el protagonista y la encrucijada del libro..."
              className="w-full px-3.5 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
