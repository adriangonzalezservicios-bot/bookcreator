import React, { useState } from 'react';
import { X, Sparkles, MapPin, Save, Trash2, BookOpen } from 'lucide-react';
import { WorldNote } from '../types/book';

interface WorldNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: WorldNote | null;
  onSave: (note: WorldNote) => void;
  onDelete?: (id: string) => void;
}

export const WorldNoteModal: React.FC<WorldNoteModalProps> = ({
  isOpen,
  onClose,
  note,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<WorldNote>({
    id: note?.id || `world-${Date.now()}`,
    title: note?.title || '',
    category: note?.category || 'Lugar',
    content: note?.content || '',
  });

  React.useEffect(() => {
    if (note) {
      setFormData(note);
    } else {
      setFormData({
        id: `world-${Date.now()}`,
        title: '',
        category: 'Lugar',
        content: '',
      });
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1a17] border border-[#38332b] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#38332b] bg-[#171512]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MapPin className="w-4 h-4" />
            </span>
            <h3 className="text-base font-medium text-stone-100">
              {note ? 'Editar Elemento del Mundo' : 'Nuevo Lugar o Elemento de Lore'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Nombre del elemento *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej. Faro de Punta de la Lanza..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Categoría</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
              >
                <option value="Lugar">Lugar</option>
                <option value="Lore / Historia">Lore / Historia</option>
                <option value="Regla o Sistema">Regla o Sistema</option>
                <option value="Objeto clave">Objeto clave</option>
                <option value="Tema / Atmósfera">Tema / Atmósfera</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-300">
              Descripción, detalles sensoriales o relevancia en la trama
            </label>
            <textarea
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Describe cómo se ve, huele, qué leyendas circulan, quién tiene acceso..."
              className="w-full px-3.5 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-800">
            {note && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Eliminar este elemento de mundo?')) {
                    onDelete(note.id);
                    onClose();
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
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
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
