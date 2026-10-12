import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  Type,
  AlignLeft,
  Sliders,
  Eye,
  MessageSquare,
  Wand2,
  BookMarked,
  StickyNote,
  ChevronDown,
  Loader2,
  Flame,
  Check,
  Undo,
  BookOpen,
  Cloud,
  Menu,
  Feather
} from 'lucide-react';
import { Chapter, EditorSettings, Book } from '../types/book';
import { countWords, estimateReadingTime } from '../utils/storage';
import { LiteraryActionType } from '../services/claudeApi';

interface EditorProps {
  chapter: Chapter;
  book: Book;
  settings: EditorSettings;
  onUpdateChapter: (updated: Partial<Chapter>) => void;
  onUpdateSettings: (updated: Partial<EditorSettings>) => void;
  onTriggerClaudeAction: (action: LiteraryActionType, text: string, title: string) => void;
  isActionLoading: boolean;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  onOpenReadingMode: () => void;
  onOpenDriveBackup: () => void;
  onToggleChapters: () => void;
  onToggleAssistant: () => void;
  isAssistantOpen: boolean;
  isChaptersOpen: boolean;
  lastSavedAt: Date | null;
  dailyWords: number;
}

export const Editor: React.FC<EditorProps> = ({
  chapter,
  book,
  settings,
  onUpdateChapter,
  onUpdateSettings,
  onTriggerClaudeAction,
  isActionLoading,
  isZenMode,
  onToggleZenMode,
  onOpenReadingMode,
  onOpenDriveBackup,
  onToggleChapters,
  onToggleAssistant,
  isAssistantOpen,
  isChaptersOpen,
  lastSavedAt,
  dailyWords,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarCoords, setToolbarCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);

  // Chapter statistics
  const chapterWords = countWords(chapter.content);
  const charCount = chapter.content.length;
  const readingTime = estimateReadingTime(chapterWords);

  // Auto-resize textarea to fit content smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(500, textareaRef.current.scrollHeight + 100)}px`;
    }
  }, [chapter.content]);

  // Handle text selection for Claude inline actions
  const handleSelect = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end).trim();

    if (text.length > 5) {
      setSelectedText(text);
      setSelectionRange({ start, end });
      setShowFloatingToolbar(true);
    } else {
      setShowFloatingToolbar(false);
    }
  };

  const handleActionClick = (action: LiteraryActionType, title: string) => {
    const textToSend = selectedText || chapter.content;
    onTriggerClaudeAction(action, textToSend, title);
    setShowFloatingToolbar(false);
  };

  // Font class mapping
  const getFontFamily = () => {
    switch (settings.font) {
      case 'garamond':
        return 'font-[EB_Garamond]';
      case 'sans':
        return 'font-sans';
      case 'mono':
        return 'font-mono text-[92%]';
      case 'newsreader':
      default:
        return 'font-serif';
    }
  };

  // Line spacing class
  const getLineSpacing = () => {
    switch (settings.lineSpacing) {
      case 'tight':
        return 'leading-relaxed';
      case 'relaxed':
        return 'leading-[2.2]';
      case 'normal':
      default:
        return 'leading-[1.9]';
    }
  };

  // Max width class
  const getMaxWidth = () => {
    switch (settings.pageWidth) {
      case 'narrow':
        return 'max-w-xl';
      case 'wide':
        return 'max-w-4xl';
      case 'medium':
      default:
        return 'max-w-2xl';
    }
  };

  // Paper theme class
  const getThemeClass = () => {
    switch (settings.theme) {
      case 'paper':
        return 'book-paper-light border-stone-300';
      case 'sepia':
        return 'book-paper-sepia border-stone-300';
      case 'midnight':
        return 'book-paper-midnight border-stone-800';
      case 'dark':
      default:
        return 'book-paper-dark border-stone-800/60';
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-[#121110] relative overflow-hidden select-text">
      {/* Editor Top Control Bar (Hidden in pure zen mode unless hovered) */}
      <div
        className={`flex items-center justify-between px-6 py-3 border-b border-[#2d2822] bg-[#161412] transition-all duration-300 ${
          isZenMode ? 'opacity-0 hover:opacity-100 absolute top-0 left-0 right-0 z-30' : ''
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
          {/* Chapters Hamburger Menu Toggle */}
          <button
            onClick={onToggleChapters}
            title="Menú de capítulos y estructura"
            className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border ${
              isChaptersOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border-stone-800'
            }`}
          >
            <Menu className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline font-medium text-[11px]">Capítulos</span>
          </button>

          <input
            type="text"
            value={chapter.title}
            onChange={(e) => onUpdateChapter({ title: e.target.value })}
            placeholder="Título del capítulo..."
            className="text-base font-semibold text-stone-100 bg-transparent border-b border-transparent hover:border-stone-700 focus:border-amber-500 focus:outline-none transition-colors truncate w-full max-w-md"
          />

          <select
            value={chapter.status}
            onChange={(e) => onUpdateChapter({ status: e.target.value as any })}
            className="text-xs px-2.5 py-1 rounded-full bg-stone-900 border border-stone-700 text-stone-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="draft">Borrador</option>
            <option value="review">En revisión</option>
            <option value="completed">Finalizado</option>
          </select>
        </div>

        {/* Styling controls & Zen Toggle */}
        <div className="flex items-center gap-2">
          {/* Notes toggle */}
          <button
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            title="Notas del capítulo"
            className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
              showNotesDrawer
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <StickyNote className="w-4 h-4" />
            <span className="hidden sm:inline">Notas</span>
          </button>

          {/* Style selector menu */}
          <div className="relative">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              title="Tipografía y Papel"
              className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {showStyleMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#1c1a17] border border-[#38332b] rounded-2xl shadow-2xl p-4 z-50 text-xs space-y-3.5 animate-in fade-in zoom-in-95">
                <div className="font-semibold text-stone-200 pb-1 border-b border-stone-800">
                  Estilo de Lectura y Escritura
                </div>

                {/* Theme paper selection */}
                <div>
                  <span className="text-stone-400 block mb-1.5 text-[11px] uppercase tracking-wider font-mono">
                    Tono del Papel
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'paper', label: 'Marfil', bg: 'bg-[#faf7f2] text-stone-900' },
                      { id: 'sepia', label: 'Sepia', bg: 'bg-[#f4ece1] text-stone-900' },
                      { id: 'dark', label: 'Carbón', bg: 'bg-[#1a1714] text-stone-200' },
                      { id: 'midnight', label: 'Noche', bg: 'bg-[#0d0f14] text-stone-200' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onUpdateSettings({ theme: t.id as any })}
                        className={`py-1.5 rounded-lg border text-center font-medium ${t.bg} ${
                          settings.theme === t.id
                            ? 'border-amber-500 ring-2 ring-amber-500/30'
                            : 'border-stone-700/60'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font selection */}
                <div>
                  <span className="text-stone-400 block mb-1.5 text-[11px] uppercase tracking-wider font-mono">
                    Tipografía
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'newsreader', label: 'Newsreader', fontClass: 'font-serif' },
                      { id: 'garamond', label: 'Garamond', fontClass: 'font-[EB_Garamond]' },
                      { id: 'sans', label: 'Sans Moderna', fontClass: 'font-sans' },
                      { id: 'mono', label: 'Máquina', fontClass: 'font-mono' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => onUpdateSettings({ font: f.id as any })}
                        className={`py-1 px-2 rounded-lg border text-left truncate ${f.fontClass} ${
                          settings.font === f.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-stone-900/60 text-stone-300 border-stone-800 hover:bg-stone-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font size */}
                <div>
                  <div className="flex justify-between text-stone-400 mb-1 text-[11px]">
                    <span>Tamaño de letra</span>
                    <span>{settings.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="24"
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Page width */}
                <div>
                  <span className="text-stone-400 block mb-1.5 text-[11px] uppercase tracking-wider font-mono">
                    Ancho de Columna
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'narrow', label: 'Estrecho' },
                      { id: 'medium', label: 'Medio' },
                      { id: 'wide', label: 'Amplio' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        onClick={() => onUpdateSettings({ pageWidth: w.id as any })}
                        className={`py-1 text-center rounded-lg border ${
                          settings.pageWidth === w.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                            : 'bg-stone-900/60 text-stone-400 border-stone-800'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reading Mode Button */}
          <button
            onClick={onOpenReadingMode}
            title="Entrar en Modo Lectura (oculta controles de edición, tipografía centrada y cómoda)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Modo Lectura</span>
          </button>

          {/* Google Drive Backup Button */}
          <button
            onClick={onOpenDriveBackup}
            title="Copia de seguridad en Google Drive"
            className="p-2 rounded-xl text-stone-400 hover:text-sky-300 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 transition-colors"
          >
            <Cloud className="w-4 h-4 text-sky-400" />
          </button>

          {/* Zen mode button */}
          <button
            onClick={onToggleZenMode}
            title={isZenMode ? 'Salir del Modo Zen' : 'Entrar en Modo Zen (Escritura libre de distracciones)'}
            className={`p-2 rounded-xl transition-colors ${
              isZenMode
                ? 'bg-amber-500 text-stone-950 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Hermes Assistant Hamburger Menu Toggle */}
          <button
            onClick={onToggleAssistant}
            title="Abrir o cerrar asistente literario Hermes (dios de la elocuencia y las letras)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-sm border ${
              isAssistantOpen
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-amber-900/30'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            <Feather className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-semibold">Hermes</span>
            <Menu className="w-3 h-3 opacity-70 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Main Manuscript Writing Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 md:py-12 flex justify-center custom-scrollbar">
        <div className={`w-full ${getMaxWidth()} flex flex-col transition-all duration-200`}>
          {/* Notes drawer (collapsible) */}
          {showNotesDrawer && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-2">
              <div className="flex items-center justify-between text-amber-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" />
                  Notas Privadas de Escena
                </span>
                <button
                  onClick={() => setShowNotesDrawer(false)}
                  className="text-stone-500 hover:text-stone-300"
                >
                  ✕
                </button>
              </div>
              <textarea
                rows={3}
                value={chapter.notes || ''}
                onChange={(e) => onUpdateChapter({ notes: e.target.value })}
                placeholder="Objetivos de la escena, recordatorios o pistas que deben plantarse en este capítulo..."
                className="w-full bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/40"
              />
            </div>
          )}

          {/* Paper sheet container */}
          <div
            className={`rounded-2xl p-6 sm:p-12 md:p-16 shadow-2xl transition-colors min-h-[75vh] flex flex-col ${getThemeClass()}`}
          >
            {/* Chapter Header inside manuscript */}
            <div className="mb-8 pb-6 border-b border-current/10">
              <span className="text-xs uppercase tracking-widest font-mono opacity-60 block mb-2">
                {book.title} · #{chapter.number}
              </span>
              <h1 className="text-2xl sm:text-3xl font-display font-medium tracking-tight">
                {chapter.title}
              </h1>
            </div>

            {/* Core Textarea */}
            <textarea
              ref={textareaRef}
              value={chapter.content}
              onChange={(e) => onUpdateChapter({ content: e.target.value })}
              onSelect={handleSelect}
              onKeyUp={handleSelect}
              onMouseUp={handleSelect}
              placeholder="Comienza a escribir tu escena aquí... La tinta cobra vida."
              style={{ fontSize: `${settings.fontSize}px` }}
              className={`w-full flex-1 bg-transparent border-none outline-none resize-none ${getFontFamily()} ${getLineSpacing()} placeholder:opacity-40 focus:ring-0 leading-relaxed overflow-hidden`}
              spellCheck="false"
            />
          </div>
        </div>
      </div>

      {/* Floating Claude Action Toolbar for selected text */}
      {showFloatingToolbar && selectedText && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 bg-[#1e1b16]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[95vw] overflow-x-auto">
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-amber-400 font-semibold border-r border-amber-900/40">
            <Feather className="w-3.5 h-3.5" />
            <span>Hermes:</span>
          </div>

          <button
            onClick={() => handleActionClick('polish', 'Pulir Prosa')}
            disabled={isActionLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-800/80 hover:bg-amber-600 hover:text-white text-stone-200 transition-colors whitespace-nowrap"
          >
            ✍️ Pulir
          </button>

          <button
            onClick={() => handleActionClick('fix_grammar', 'Corrección Gramatical')}
            disabled={isActionLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-800/80 hover:bg-amber-600 hover:text-white text-stone-200 transition-colors whitespace-nowrap"
          >
            🔍 Corregir
          </button>

          <button
            onClick={() => handleActionClick('show_dont_tell', 'Mostrar, No Contar')}
            disabled={isActionLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-800/80 hover:bg-amber-600 hover:text-white text-stone-200 transition-colors whitespace-nowrap"
          >
            👁️ Mostrar
          </button>

          <button
            onClick={() => handleActionClick('dialogue', 'Afilar Diálogos')}
            disabled={isActionLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-800/80 hover:bg-amber-600 hover:text-white text-stone-200 transition-colors whitespace-nowrap"
          >
            💬 Diálogo
          </button>

          <button
            onClick={() => handleActionClick('continue', 'Continuar Escena')}
            disabled={isActionLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-800/80 hover:bg-amber-600 hover:text-white text-stone-200 transition-colors whitespace-nowrap"
          >
            ➕ Continuar
          </button>

          <button
            onClick={() => handleActionClick('darker_tension', 'Aumentar Tensión')}
            disabled={isActionLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-800/80 hover:bg-amber-600 hover:text-white text-stone-200 transition-colors whitespace-nowrap"
          >
            ⚡ Tensión
          </button>

          {isActionLoading && (
            <div className="px-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            </div>
          )}
        </div>
      )}

      {/* Bottom Status Bar */}
      <footer className="px-6 py-2.5 border-t border-[#2d2822] bg-[#161412] text-xs text-stone-400 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-stone-300 font-mono">
            <strong>{chapterWords.toLocaleString()}</strong> palabras en este capítulo
          </span>
          <span className="hidden sm:inline text-stone-600">•</span>
          <span className="hidden sm:flex items-center gap-1 text-stone-400 font-mono">
            {charCount.toLocaleString()} caracteres
          </span>
          <span className="hidden md:inline text-stone-600">•</span>
          <span className="hidden md:flex items-center gap-1 text-stone-400">
            <Clock className="w-3 h-3 text-stone-500" />
            {readingTime}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-stone-400 text-[11px]">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-stone-300 font-semibold">{dailyWords}</span> palabras hoy
          </span>

          <span className="text-stone-600">•</span>

          <span className="flex items-center gap-1.5 text-stone-500 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {lastSavedAt ? `Guardado ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Guardado'}
          </span>
        </div>
      </footer>
    </main>
  );
};
