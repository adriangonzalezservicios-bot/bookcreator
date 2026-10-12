import React, { useState } from 'react';
import { X, Sparkles, User, Target, HeartCrack, Volume2, Save, Trash2, Loader2 } from 'lucide-react';
import { Character, Book } from '../types/book';
import { executeClaudeAction, extractBookContext } from '../services/claudeApi';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
  book: Book;
  onSave: (char: Character) => void;
  onDelete?: (id: string) => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  character,
  book,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Character>({
    id: character?.id || `char-${Date.now()}`,
    name: character?.name || '',
    role: character?.role || 'Secundario',
    archetype: character?.archetype || '',
    goal: character?.goal || '',
    wound: character?.wound || '',
    physical: character?.physical || '',
    voice: character?.voice || '',
    notes: character?.notes || '',
  });

  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    if (character) {
      setFormData(character);
    } else {
      setFormData({
        id: `char-${Date.now()}`,
        name: '',
        role: 'Protagonista',
        archetype: '',
        goal: '',
        wound: '',
        physical: '',
        voice: '',
        notes: '',
      });
    }
  }, [character, isOpen]);

  if (!isOpen) return null;

  const handleClaudeSuggest = async () => {
    setIsGenerating(true);
    try {
      const bookContext = extractBookContext(book);
      const prompt = `Crea o complementa la ficha de un personaje con nombre "${formData.name || 'por definir'}" y rol "${formData.role}".
Devuelve sugerencias literarias ricas en profundidad psicológica y detalles sensoriales.`;
      const res = await executeClaudeAction('character_suggest', prompt, bookContext);

      // Append Claude's insights to notes or fill fields
      setFormData((prev) => ({
        ...prev,
        notes: (prev.notes ? prev.notes + '\n\n' : '') + `--- Sugerencias de Claude ---\n` + res.result,
      }));
    } catch (err: any) {
      alert(`Error al consultar a Claude: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1a17] border border-[#38332b] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#38332b] bg-[#171512]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <User className="w-4 h-4" />
            </span>
            <h3 className="text-base font-medium text-stone-100">
              {character ? 'Editar Personaje' : 'Nuevo Personaje'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Nombre del personaje *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Elena Varela, Conde Arístides..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Rol narrativo</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
              >
                <option value="Protagonista">Protagonista</option>
                <option value="Antagonista">Antagonista</option>
                <option value="Coprotagonista">Coprotagonista</option>
                <option value="Mentor">Mentor</option>
                <option value="Aliado">Aliado</option>
                <option value="Secundario">Secundario</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-300">Arquetipo o esencia</label>
            <input
              type="text"
              value={formData.archetype || ''}
              onChange={(e) => setFormData({ ...formData, archetype: e.target.value })}
              placeholder="Ej. La investigadora escéptica, El soldado desencantado..."
              className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                Deseo consciente (Objetivo)
              </label>
              <textarea
                rows={2}
                value={formData.goal || ''}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder="¿Qué busca alcanzar activamente en la historia?"
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                <HeartCrack className="w-3.5 h-3.5 text-rose-400" />
                Herida o Conflicto interno
              </label>
              <textarea
                rows={2}
                value={formData.wound || ''}
                onChange={(e) => setFormData({ ...formData, wound: e.target.value })}
                placeholder="¿Qué trauma, secreto o debilidad arrastra?"
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Rasgos físicos distintivos</label>
              <textarea
                rows={2}
                value={formData.physical || ''}
                onChange={(e) => setFormData({ ...formData, physical: e.target.value })}
                placeholder="Cicatrices, mirada, postura, vestimenta característica..."
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                Voz y forma de hablar
              </label>
              <textarea
                rows={2}
                value={formData.voice || ''}
                onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
                placeholder="Tono, cadencia, muletillas, si usa jerga o formalidad..."
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-stone-300">Notas libres y biografía</label>
              <button
                type="button"
                onClick={handleClaudeSuggest}
                disabled={isGenerating}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Consultando a Claude...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Profundizar con Claude
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalles adicionales, relaciones con otros personajes, secretos..."
              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Footer inside form */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-800">
            {character && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Eliminar este personaje?')) {
                    onDelete(character.id);
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
                Guardar Personaje
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
