import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Sliders,
  Type,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  BookOpen,
  Clock,
  Sparkles,
  AlignLeft,
  AlignJustify,
  Sun,
  Moon,
  Coffee,
  Check
} from 'lucide-react';
import { Chapter, Book, PaperTheme, FontChoice } from '../types/book';
import { countWords, estimateReadingTime } from '../utils/storage';

interface ReadingModeProps {
  chapter: Chapter;
  book: Book;
  onClose: () => void;
  onSelectChapter: (chapterId: string) => void;
}

export const ReadingMode: React.FC<ReadingModeProps> = ({
  chapter,
  book,
  onClose,
  onSelectChapter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Reading Mode custom preferences
  const [theme, setTheme] = useState<PaperTheme>('sepia');
  const [font, setFont] = useState<FontChoice>('newsreader');
  const [fontSize, setFontSize] = useState<number>(20); // 16 to 26
  const [lineHeight, setLineHeight] = useState<number>(2.0); // 1.6 to 2.6
  const [paragraphSpacing, setParagraphSpacing] = useState<'normal' | 'relaxed' | 'spacious'>('relaxed');
  const [columnWidth, setColumnWidth] = useState<'narrow' | 'medium' | 'wide'>('medium');
  const [textAlignment, setTextAlignment] = useState<'left' | 'justify'>('justify');
  const [showControls, setShowControls] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [enableDropCap, setEnableDropCap] = useState(true);

  const chapterWords = countWords(chapter.content);
  const readingTime = estimateReadingTime(chapterWords);

  // Current chapter index
  const currentIndex = book.chapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? book.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < book.chapters.length - 1 ? book.chapters[currentIndex + 1] : null;

  // ESC key listener to exit reading mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Track scroll progress
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const progress = Math.min(
      100,
      Math.max(0, Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight || 1)) * 100))
    );
    setScrollProgress(progress);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Color theme mapping
  const getThemeClasses = () => {
    switch (theme) {
      case 'paper':
        return {
          bg: 'bg-[#faf7f2]',
          text: 'text-[#24211e]',
          border: 'border-[#e6ded3]',
          subtext: 'text-[#7a7267]',
          card: 'bg-[#f4efe6]',
        };
      case 'dark':
        return {
          bg: 'bg-[#181614]',
          text: 'text-[#ded8cf]',
          border: 'border-[#2d2822]',
          subtext: 'text-[#948c82]',
          card: 'bg-[#221f1b]',
        };
      case 'midnight':
        return {
          bg: 'bg-[#0d0f14]',
          text: 'text-[#d6dbe4]',
          border: 'border-[#1e2330]',
          subtext: 'text-[#7e879b]',
          card: 'bg-[#151922]',
        };
      case 'sepia':
      default:
        return {
          bg: 'bg-[#f4ece1]',
          text: 'text-[#382e24]',
          border: 'border-[#ded4c3]',
          subtext: 'text-[#85735f]',
          card: 'bg-[#ebdcc8]',
        };
    }
  };

  const themeClasses = getThemeClasses();

  // Font family class
  const getFontFamily = () => {
    switch (font) {
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

  // Column width class
  const getColumnWidthClass = () => {
    switch (columnWidth) {
      case 'narrow':
        return 'max-w-xl';
      case 'wide':
        return 'max-w-3xl';
      case 'medium':
      default:
        return 'max-w-2xl';
    }
  };

  // Paragraph gap class
  const getParagraphGapClass = () => {
    switch (paragraphSpacing) {
      case 'normal':
        return 'space-y-4';
      case 'spacious':
        return 'space-y-8';
      case 'relaxed':
      default:
        return 'space-y-6';
    }
  };

  // Split content into clean paragraphs
  const paragraphs = chapter.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300 select-text overflow-hidden`}
    >
      {/* Top Reading Bar (Floating, Minimalist) */}
      <header
        className={`flex items-center justify-between px-6 py-3 border-b ${themeClasses.border} backdrop-blur-md bg-opacity-90 z-20 transition-all duration-200 select-none`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${themeClasses.border} hover:opacity-80 transition-all`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Editar</span>
            <span className="hidden sm:inline text-[10px] opacity-60 font-mono ml-1">ESC</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs opacity-75">
            <span className="font-medium truncate max-w-xs">{book.title}</span>
            <span>•</span>
            <span className="truncate max-w-xs">{chapter.title}</span>
          </div>
        </div>

        {/* Center Progress indicator */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="w-32 h-1.5 rounded-full bg-current/10 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-150"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
          <span className="font-mono text-[11px] opacity-70">{scrollProgress}% leído</span>
          <span className="opacity-40">•</span>
          <span className="opacity-70 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {readingTime}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Spacing & Typography Settings Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowControls(!showControls)}
              className={`p-2 rounded-xl text-xs flex items-center gap-1.5 border ${themeClasses.border} ${
                showControls ? 'ring-2 ring-amber-500/50 bg-amber-500/10 text-amber-500' : ''
              } hover:opacity-80 transition-all`}
              title="Ajustes de espaciado y tipografía"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Ajustes</span>
            </button>

            {/* Dropdown controls modal */}
            {showControls && (
              <div
                className={`absolute right-0 top-full mt-2 w-72 rounded-2xl border ${themeClasses.border} shadow-2xl p-4 text-xs space-y-4 z-50 animate-in fade-in zoom-in-95 ${
                  theme === 'dark' || theme === 'midnight'
                    ? 'bg-[#1c1a17] text-stone-200'
                    : 'bg-[#fcfaf7] text-stone-900'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-current/10 font-semibold">
                  <span>Control de Lectura y Espaciado</span>
                  <button
                    onClick={() => setShowControls(false)}
                    className="opacity-60 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>

                {/* Theme paper selector */}
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-mono opacity-70 mb-1.5">
                    Ambiente de lectura
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'paper', label: 'Marfil', bg: 'bg-[#faf7f2] text-stone-900' },
                      { id: 'sepia', label: 'Sepia', bg: 'bg-[#f4ece1] text-stone-900' },
                      { id: 'dark', label: 'Carbón', bg: 'bg-[#1a1714] text-stone-100' },
                      { id: 'midnight', label: 'Noche', bg: 'bg-[#0d0f14] text-stone-100' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id as any)}
                        className={`py-1.5 rounded-lg border text-center font-medium ${t.bg} ${
                          theme === t.id
                            ? 'ring-2 ring-amber-500 border-amber-500'
                            : 'border-current/20'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font selection */}
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-mono opacity-70 mb-1.5">
                    Tipografía
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'newsreader', label: 'Newsreader', fontClass: 'font-serif' },
                      { id: 'garamond', label: 'Garamond', fontClass: 'font-[EB_Garamond]' },
                      { id: 'sans', label: 'Moderna Sans', fontClass: 'font-sans' },
                      { id: 'mono', label: 'Tipográfica', fontClass: 'font-mono' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFont(f.id as any)}
                        className={`p-1.5 rounded-lg border text-left truncate ${f.fontClass} ${
                          font === f.id
                            ? 'ring-2 ring-amber-500/50 border-amber-500 font-semibold'
                            : 'border-current/15 hover:bg-current/5'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font size control */}
                <div>
                  <div className="flex justify-between opacity-70 mb-1 text-[11px]">
                    <span>Tamaño de letra</span>
                    <span className="font-mono">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="26"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Line Height (Espaciado de líneas) */}
                <div>
                  <div className="flex justify-between opacity-70 mb-1 text-[11px]">
                    <span>Espaciado entre líneas (Interlineado)</span>
                    <span className="font-mono">{lineHeight.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { val: 1.6, label: '1.6' },
                      { val: 1.9, label: '1.9' },
                      { val: 2.2, label: '2.2' },
                      { val: 2.6, label: '2.6' },
                    ].map((lh) => (
                      <button
                        key={lh.val}
                        onClick={() => setLineHeight(lh.val)}
                        className={`py-1 rounded-lg border text-center ${
                          Math.abs(lineHeight - lh.val) < 0.05
                            ? 'bg-amber-500/20 border-amber-500 font-semibold text-amber-500'
                            : 'border-current/15'
                        }`}
                      >
                        {lh.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paragraph spacing */}
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-mono opacity-70 mb-1.5">
                    Separación entre Párrafos
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'normal', label: 'Compacto' },
                      { id: 'relaxed', label: 'Cómodo' },
                      { id: 'spacious', label: 'Amplio' },
                    ].map((ps) => (
                      <button
                        key={ps.id}
                        onClick={() => setParagraphSpacing(ps.id as any)}
                        className={`py-1 text-center rounded-lg border text-xs ${
                          paragraphSpacing === ps.id
                            ? 'bg-amber-500/20 border-amber-500 font-semibold text-amber-500'
                            : 'border-current/15'
                        }`}
                      >
                        {ps.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column Width */}
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-mono opacity-70 mb-1.5">
                    Ancho de Página
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'narrow', label: 'Estrecho' },
                      { id: 'medium', label: 'Medio' },
                      { id: 'wide', label: 'Amplio' },
                    ].map((cw) => (
                      <button
                        key={cw.id}
                        onClick={() => setColumnWidth(cw.id as any)}
                        className={`py-1 text-center rounded-lg border text-xs ${
                          columnWidth === cw.id
                            ? 'bg-amber-500/20 border-amber-500 font-semibold text-amber-500'
                            : 'border-current/15'
                        }`}
                      >
                        {cw.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alignment & Drop Cap options */}
                <div className="flex items-center justify-between pt-2 border-t border-current/10">
                  <div className="flex items-center gap-1 border border-current/15 rounded-lg p-0.5">
                    <button
                      onClick={() => setTextAlignment('left')}
                      className={`p-1 rounded ${textAlignment === 'left' ? 'bg-amber-500/20 text-amber-500' : 'opacity-60'}`}
                      title="Alinear a la izquierda"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTextAlignment('justify')}
                      className={`p-1 rounded ${textAlignment === 'justify' ? 'bg-amber-500/20 text-amber-500' : 'opacity-60'}`}
                      title="Justificar texto"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <label className="flex items-center gap-1.5 text-xs cursor-pointer opacity-80 hover:opacity-100">
                    <input
                      type="checkbox"
                      checked={enableDropCap}
                      onChange={(e) => setEnableDropCap(e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    <span>Letra capitular</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl text-xs border ${themeClasses.border} hover:opacity-80 transition-all`}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Reading Flow (Centered book view) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-12 md:py-20 flex justify-center custom-scrollbar"
      >
        <article className={`w-full ${getColumnWidthClass()} mx-auto transition-all duration-300 pb-24`}>
          {/* Chapter Opening Header */}
          <header className="mb-14 pb-8 text-center border-b border-current/10">
            <span className="text-xs uppercase tracking-[0.25em] font-mono opacity-60 block mb-3">
              {book.title}
            </span>
            <span className="text-sm font-display uppercase tracking-widest text-amber-600 dark:text-amber-400 font-semibold block mb-2">
              Capítulo {chapter.number}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium tracking-tight mb-4 leading-tight">
              {chapter.title}
            </h1>
            <div className="flex items-center justify-center gap-3 text-xs opacity-60 mt-4">
              <span>{chapterWords.toLocaleString()} palabras</span>
              <span>•</span>
              <span>{readingTime}</span>
            </div>
          </header>

          {/* Chapter Prose Content */}
          <div
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
            }}
            className={`${getFontFamily()} ${getParagraphGapClass()} ${
              textAlignment === 'justify' ? 'text-justify' : 'text-left'
            } transition-all duration-200 select-text`}
          >
            {paragraphs.map((para, idx) => {
              // Apply drop cap to the very first paragraph if enabled
              if (idx === 0 && enableDropCap && para.length > 0) {
                const firstChar = para.charAt(0);
                const restOfPara = para.slice(1);
                return (
                  <p key={idx} className="relative">
                    <span className="float-left text-5xl md:text-6xl font-display font-bold leading-none pr-3 pt-1 text-amber-700 dark:text-amber-400 select-none">
                      {firstChar}
                    </span>
                    {restOfPara}
                  </p>
                );
              }

              return (
                <p key={idx} className="leading-relaxed">
                  {para}
                </p>
              );
            })}

            {paragraphs.length === 0 && (
              <p className="text-center italic opacity-50 py-12">
                (Este capítulo aún no tiene contenido escrito).
              </p>
            )}
          </div>

          {/* Chapter Ending Ornament */}
          <div className="my-16 text-center select-none opacity-40">
            <span className="text-lg tracking-widest">❖ ❖ ❖</span>
          </div>

          {/* Bottom Chapter Navigation */}
          <footer className="pt-8 border-t border-current/10 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
            {prevChapter ? (
              <button
                onClick={() => {
                  onSelectChapter(prevChapter.id);
                  containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-2 p-3 rounded-xl border ${themeClasses.border} hover:opacity-80 transition-all text-left max-w-xs`}
              >
                <ChevronLeft className="w-5 h-5 shrink-0 text-amber-500" />
                <div className="truncate">
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-60 block">
                    Capítulo anterior
                  </span>
                  <span className="text-xs font-semibold truncate block">
                    {prevChapter.title}
                  </span>
                </div>
              </button>
            ) : <div />}

            <div className="text-xs text-center opacity-60">
              Capítulo {currentIndex + 1} de {book.chapters.length}
            </div>

            {nextChapter ? (
              <button
                onClick={() => {
                  onSelectChapter(nextChapter.id);
                  containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center justify-end gap-2 p-3 rounded-xl border ${themeClasses.border} hover:opacity-80 transition-all text-right max-w-xs ml-auto`}
              >
                <div className="truncate">
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-60 block">
                    Siguiente capítulo
                  </span>
                  <span className="text-xs font-semibold truncate block">
                    {nextChapter.title}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 shrink-0 text-amber-500" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs border ${themeClasses.border} font-medium hover:opacity-80 transition-all ml-auto`}
              >
                Fin del libro • Volver a editar
              </button>
            )}
          </footer>
        </article>
      </div>
    </div>
  );
};
