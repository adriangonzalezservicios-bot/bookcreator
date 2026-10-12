import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Settings,
  Users,
  Compass,
  FileText,
  Download,
  BarChart2,
  ChevronRight,
  Sparkles,
  Printer,
  Upload,
  MoreVertical,
  CheckCircle2,
  CircleDashed,
  Clock,
  Layers,
  FolderPlus,
  Cloud,
  X
} from 'lucide-react';
import { Book, Chapter, Character, WorldNote } from '../types/book';
import { countWords, exportBookAsMarkdown, exportBookAsText, exportBackupJSON } from '../utils/storage';

interface SidebarProps {
  book: Book;
  books: Book[];
  activeChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: () => void;
  onDeleteChapter: (chapterId: string) => void;
  onReorderChapter: (chapterId: string, direction: 'up' | 'down') => void;
  onOpenBookSettings: () => void;
  onOpenStats: () => void;
  onOpenCharacterModal: (character: Character | null) => void;
  onOpenWorldModal: (note: WorldNote | null) => void;
  onSwitchBook: (bookId: string) => void;
  onCreateNewBook: () => void;
  onImportBackup: (importedBooks: Book[]) => void;
  onOpenImportManuscript: () => void;
  onOpenReadingMode: () => void;
  onOpenDriveBackup: () => void;
  isOpen: boolean;
  onToggle: () => void;
  isAssistantOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  book,
  books,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  onReorderChapter,
  onOpenBookSettings,
  onOpenStats,
  onOpenCharacterModal,
  onOpenWorldModal,
  onSwitchBook,
  onCreateNewBook,
  onImportBackup,
  onOpenImportManuscript,
  onOpenReadingMode,
  onOpenDriveBackup,
  isOpen,
  onToggle,
  isAssistantOpen = false,
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'characters' | 'world'>('chapters');
  const [showBookSelector, setShowBookSelector] = useState(false);

  const totalWords = book.chapters.reduce(
    (acc, chap) => acc + countWords(chap.content),
    0
  );

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportBackup(parsed);
          alert('¡Copia de seguridad importada con éxito!');
        } else {
          alert('Formato de archivo inválido.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleChapterClick = (chapterId: string) => {
    onSelectChapter(chapterId);
    if (isAssistantOpen) {
      onToggle(); // Close chapter drawer when picking a chapter while Hermes assistant is open
    }
  };

  if (!isOpen) {
    return null;
  }

  const sidebarContent = (
    <aside className="w-80 max-w-[85vw] h-full flex flex-col bg-[#161412] border-r border-[#2d2822] text-stone-300 select-none shadow-2xl z-40 shrink-0">
      {/* Book header */}
      <div className="p-4 border-b border-[#2d2822] bg-[#1a1714]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500/90 font-mono">
              Manuscrito
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenReadingMode}
              title="Entrar en Modo Lectura"
              className="p-1.5 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenDriveBackup}
              title="Copia de seguridad en Google Drive"
              className="p-1.5 rounded-lg text-sky-400/80 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
            >
              <Cloud className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenStats}
              title="Estadísticas del manuscrito"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenBookSettings}
              title="Ajustes de la obra"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              title="Cerrar panel de capítulos"
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-200 hover:bg-stone-800/80 transition-colors ml-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Book switcher / dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowBookSelector(!showBookSelector)}
            className="w-full flex items-center justify-between text-left group p-1.5 -mx-1.5 rounded-xl hover:bg-stone-800/40 transition-colors"
          >
            <div className="truncate pr-2">
              <h2 className="text-sm font-semibold text-stone-100 truncate group-hover:text-amber-300 transition-colors">
                {book.title}
              </h2>
              <p className="text-xs text-stone-400 truncate mt-0.5">
                {book.genre || 'Ficción'} · {totalWords.toLocaleString()} pal.
              </p>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-stone-500 transition-transform ${
                showBookSelector ? 'rotate-90 text-amber-400' : ''
              }`}
            />
          </button>

          {showBookSelector && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1f1c18] border border-[#3c342a] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 px-2 py-1">
                Tus Obras
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
                {books.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onSwitchBook(b.id);
                      setShowBookSelector(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs truncate flex items-center justify-between ${
                      b.id === book.id
                        ? 'bg-amber-500/20 text-amber-300 font-medium'
                        : 'text-stone-300 hover:bg-stone-800/60'
                    }`}
                  >
                    <span className="truncate">{b.title}</span>
                    <span className="text-[10px] text-stone-500 ml-2">
                      {b.chapters.length} cap.
                    </span>
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    onCreateNewBook();
                    setShowBookSelector(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  Crear Nuevo Libro
                </button>
                <button
                  onClick={() => {
                    onOpenImportManuscript();
                    setShowBookSelector(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-stone-300 bg-stone-800 hover:bg-stone-700 rounded-lg border border-stone-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  Subir o Importar Manuscrito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-[#2d2822] bg-[#141210] px-2 pt-2 gap-1">
        <button
          onClick={() => setActiveTab('chapters')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-t-lg transition-colors ${
            activeTab === 'chapters'
              ? 'bg-[#161412] text-amber-400 border-t-2 border-amber-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Capítulos ({book.chapters.length})
        </button>
        <button
          onClick={() => setActiveTab('characters')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-t-lg transition-colors ${
            activeTab === 'characters'
              ? 'bg-[#161412] text-amber-400 border-t-2 border-amber-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Personajes ({book.characters.length})
        </button>
        <button
          onClick={() => setActiveTab('world')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-t-lg transition-colors ${
            activeTab === 'world'
              ? 'bg-[#161412] text-amber-400 border-t-2 border-amber-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Mundo ({book.worldNotes.length})
        </button>
      </div>

      {/* Tab content area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {activeTab === 'chapters' && (
          <>
            <div className="flex items-center justify-between pb-2 mb-2 px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Estructura de la obra
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenImportManuscript}
                  title="Subir o importar manuscrito (.txt, .md o pegar texto)"
                  className="flex items-center gap-1 text-[11px] text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-2 py-0.5 rounded-lg border border-stone-700 transition-colors"
                >
                  <Upload className="w-3 h-3 text-amber-400" />
                  Subir
                </button>
                <button
                  onClick={onAddChapter}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Capítulo
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {book.chapters.map((chap, idx) => {
                const words = countWords(chap.content);
                const isActive = chap.id === activeChapterId;
                return (
                  <div
                    key={chap.id}
                    onClick={() => handleChapterClick(chap.id)}
                    className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-amber-500/15 border border-amber-500/40 text-stone-100 shadow-sm'
                        : 'hover:bg-stone-800/40 text-stone-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 truncate flex-1 min-w-0 pr-2">
                      <span
                        className={`text-xs font-mono font-medium mt-0.5 ${
                          isActive ? 'text-amber-400' : 'text-stone-500'
                        }`}
                      >
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </span>
                      <div className="truncate flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {chap.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-stone-500">
                          <span>{words} palabras</span>
                          <span>•</span>
                          <span className="capitalize">
                            {chap.status === 'completed'
                              ? 'Listo'
                              : chap.status === 'review'
                              ? 'Revisión'
                              : 'Borrador'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions on hover */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      {idx > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderChapter(chap.id, 'up');
                          }}
                          title="Mover arriba"
                          className="p-1 hover:text-stone-100 hover:bg-stone-700/60 rounded"
                        >
                          ↑
                        </button>
                      )}
                      {idx < book.chapters.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderChapter(chap.id, 'down');
                          }}
                          title="Mover abajo"
                          className="p-1 hover:text-stone-100 hover:bg-stone-700/60 rounded"
                        >
                          ↓
                        </button>
                      )}
                      {book.chapters.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`¿Eliminar "${chap.title}"?`)) {
                              onDeleteChapter(chap.id);
                            }
                          }}
                          title="Eliminar capítulo"
                          className="p-1 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'characters' && (
          <>
            <div className="flex items-center justify-between pb-2 mb-2 px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Biblia de Personajes
              </span>
              <button
                onClick={() => onOpenCharacterModal(null)}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/20 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Personaje
              </button>
            </div>

            <div className="space-y-1.5">
              {book.characters.map((char) => (
                <div
                  key={char.id}
                  onClick={() => onOpenCharacterModal(char)}
                  className="p-2.5 rounded-xl border border-stone-800/80 bg-stone-900/40 hover:bg-stone-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-stone-200">
                      {char.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 border border-stone-700/50">
                      {char.role}
                    </span>
                  </div>
                  {char.archetype && (
                    <p className="text-[11px] text-stone-400 truncate">
                      {char.archetype}
                    </p>
                  )}
                  {char.goal && (
                    <p className="text-[10px] text-stone-500 truncate mt-0.5">
                      Objetivo: {char.goal}
                    </p>
                  )}
                </div>
              ))}

              {book.characters.length === 0 && (
                <div className="p-4 text-center text-xs text-stone-500">
                  No hay personajes registrados todavía. Añade uno para que Hermes conozca sus motivaciones.
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'world' && (
          <>
            <div className="flex items-center justify-between pb-2 mb-2 px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Construcción de Mundo
              </span>
              <button
                onClick={() => onOpenWorldModal(null)}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/20 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Elemento
              </button>
            </div>

            <div className="space-y-1.5">
              {book.worldNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onOpenWorldModal(note)}
                  className="p-2.5 rounded-xl border border-stone-800/80 bg-stone-900/40 hover:bg-stone-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-stone-200">
                      {note.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-emerald-400 border border-stone-700/50">
                      {note.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-2">
                    {note.content}
                  </p>
                </div>
              ))}

              {book.worldNotes.length === 0 && (
                <div className="p-4 text-center text-xs text-stone-500">
                  Registra lugares emblemáticos, leyendas o reglas mágicas para mantener la consistencia.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Export & Actions footer */}
      <div className="p-3 border-t border-[#2d2822] bg-[#141210] space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 px-1">
          Exportar y Respaldo
        </div>

        {/* Google Drive Primary Button */}
        <button
          onClick={onOpenDriveBackup}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-medium transition-colors shadow-sm"
        >
          <Cloud className="w-4 h-4 text-sky-400" />
          <span>Backup en Google Drive</span>
        </button>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => exportBookAsMarkdown(book)}
            title="Descargar manuscrito completo en formato Markdown (.md)"
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-[10px] text-stone-300 border border-stone-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
            Markdown
          </button>
          <button
            onClick={() => exportBookAsText(book)}
            title="Descargar en texto plano (.txt)"
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-[10px] text-stone-300 border border-stone-800 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400 mb-0.5" />
            Texto
          </button>
          <button
            onClick={handlePrint}
            title="Formato de lectura e impresión / Guardar como PDF"
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-[10px] text-stone-300 border border-stone-800 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
            PDF / Imprenta
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-stone-800/80 text-[11px]">
          <button
            onClick={() => exportBackupJSON(books)}
            className="text-stone-400 hover:text-stone-200 transition-colors flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Backup JSON
          </button>

          <button
            onClick={onOpenImportManuscript}
            className="text-stone-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <Upload className="w-3 h-3 text-amber-400" />
            Subir Manuscrito
          </button>
        </div>
      </div>
    </aside>
  );

  if (isAssistantOpen) {
    return (
      <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={onToggle}
        />
        <div className="relative z-10 h-full animate-in slide-in-from-left duration-300">
          {sidebarContent}
        </div>
      </div>
    );
  }

  return sidebarContent;
};
