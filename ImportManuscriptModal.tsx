import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  BookOpen,
  Sparkles,
  Layers,
  Check,
  AlertCircle,
  Scissors,
  PlusCircle,
  FileUp,
  FileCode,
  Loader2
} from 'lucide-react';
import mammoth from 'mammoth';
import { Book, Chapter } from '../types/book';
import { countWords } from '../utils/storage';

interface ImportManuscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBook: Book;
  currentChapter: Chapter;
  onImportAsNewBook: (newBook: Book) => void;
  onImportChaptersToCurrentBook: (newChapters: Chapter[]) => void;
  onReplaceCurrentChapter: (content: string, title?: string) => void;
  onImportBackupJSON: (books: Book[]) => void;
}

export const ImportManuscriptModal: React.FC<ImportManuscriptModalProps> = ({
  isOpen,
  onClose,
  currentBook,
  currentChapter,
  onImportAsNewBook,
  onImportChaptersToCurrentBook,
  onReplaceCurrentChapter,
  onImportBackupJSON,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste' | 'backup'>('file');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [importDestination, setImportDestination] = useState<'new_book' | 'add_chapters' | 'replace_chapter'>('new_book');
  const [detectedTitle, setDetectedTitle] = useState('Mi Manuscrito');
  const [detectedChapters, setDetectedChapters] = useState<Array<{ title: string; content: string; words: number }>>([]);
  const [autoSplit, setAutoSplit] = useState(true);
  const [isParsingDocx, setIsParsingDocx] = useState(false);

  if (!isOpen) return null;

  // Smart parser to detect chapters from markdown, titles, or chapter patterns
  const parseChaptersFromText = (text: string): Array<{ title: string; content: string; words: number }> => {
    if (!text.trim()) return [];

    // Common chapter title patterns:
    // "Capítulo 1", "Capítulo I", "Capitulo 1: Titulo", "# Capitulo", "CHAPTER 1", "ACTO 1", "1. Titulo"
    const chapterPattern = /(?:^|\n)(?:#{1,3}\s*|(?=(?:Cap[íi]tulo|Chapter|Acto|Parte|Episodio)\s+[0-9IVXLCDM]+|[0-9]+\.\s+[A-ZÁÉÍÓÚ]))([^\n]+)(?:\n|$)/gi;

    const matches: Array<{ title: string; index: number }> = [];
    let match;

    while ((match = chapterPattern.exec(text)) !== null) {
      const titleCandidate = match[1].trim();
      // Filter out markdown headers that are just words without chapter cues if text has chapter markers
      if (titleCandidate.length > 2 && titleCandidate.length < 100) {
        matches.push({
          title: titleCandidate.replace(/^#+\s*/, ''),
          index: match.index,
        });
      }
    }

    // If no distinct chapter headers found or autoSplit is disabled, return as single piece
    if (!autoSplit || matches.length <= 1) {
      return [
        {
          title: detectedTitle || 'Capítulo 1',
          content: text.trim(),
          words: countWords(text),
        },
      ];
    }

    const chapters: Array<{ title: string; content: string; words: number }> = [];

    // Prologue or intro before first chapter
    if (matches[0].index > 80) {
      const prologueContent = text.substring(0, matches[0].index).trim();
      if (prologueContent) {
        chapters.push({
          title: 'Prólogo / Introducción',
          content: prologueContent,
          words: countWords(prologueContent),
        });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const startIndex = current.index;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index : text.length;

      // Slice content and remove the title line itself from content
      let chapterBody = text.substring(startIndex, endIndex).trim();
      const firstNewline = chapterBody.indexOf('\n');
      if (firstNewline !== -1) {
        chapterBody = chapterBody.substring(firstNewline).trim();
      }

      chapters.push({
        title: current.title,
        content: chapterBody,
        words: countWords(chapterBody),
      });
    }

    return chapters;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    setDetectedTitle(cleanName);

    const lowerName = file.name.toLowerCase();

    // Word .docx processing with mammoth
    if (lowerName.endsWith('.docx')) {
      setIsParsingDocx(true);
      file
        .arrayBuffer()
        .then(async (arrayBuffer) => {
          try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            const text = result.value || '';
            if (!text.trim()) {
              alert('El documento de Word no contiene texto editable legible.');
              return;
            }
            setRawContent(text);
            const parsed = parseChaptersFromText(text);
            setDetectedChapters(parsed);
          } catch (err: any) {
            console.error('Error procesando Word:', err);
            alert(`No se pudo extraer el texto de Word: ${err.message}`);
          } finally {
            setIsParsingDocx(false);
          }
        })
        .catch((err) => {
          setIsParsingDocx(false);
          alert(`Error al leer el archivo Word: ${err.message}`);
        });
      return;
    }

    // Older binary .doc
    if (lowerName.endsWith('.doc')) {
      alert('Los documentos .doc antiguos (Word 97-2003) no son compatibles directamente. Ábrelo en Word y guárdalo como .docx o .txt para importarlo.');
      return;
    }

    // JSON backup file
    if (lowerName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportBackupJSON(parsed);
            onClose();
          } else if (parsed && parsed.books && Array.isArray(parsed.books)) {
            onImportBackupJSON(parsed.books);
            onClose();
          } else {
            alert('Formato de copia de seguridad JSON no reconocido.');
          }
        } catch {
          alert('Error al leer el archivo JSON.');
        }
      };
      reader.readAsText(file);
      return;
    }

    // Text / Markdown files
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setRawContent(text);
      const parsed = parseChaptersFromText(text);
      setDetectedChapters(parsed);
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (val: string) => {
    setPastedText(val);
    setRawContent(val);
    const parsed = parseChaptersFromText(val);
    setDetectedChapters(parsed);
  };

  const handleConfirmImport = () => {
    const chaptersToImport = detectedChapters.length > 0
      ? detectedChapters
      : parseChaptersFromText(rawContent);

    if (chaptersToImport.length === 0 || !rawContent.trim()) {
      alert('Por favor selecciona un archivo o pega el texto de tu manuscrito.');
      return;
    }

    if (importDestination === 'replace_chapter') {
      const contentToApply = chaptersToImport.map((c) => c.content).join('\n\n');
      onReplaceCurrentChapter(contentToApply, chaptersToImport[0]?.title);
      onClose();
    } else if (importDestination === 'add_chapters') {
      const newChaps: Chapter[] = chaptersToImport.map((c, idx) => ({
        id: `chap-${Date.now()}-${idx}`,
        number: currentBook.chapters.length + idx + 1,
        title: c.title || `Capítulo ${currentBook.chapters.length + idx + 1}`,
        content: c.content,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      }));
      onImportChaptersToCurrentBook(newChaps);
      onClose();
    } else {
      // Create new book
      const newBook: Book = {
        id: `book-${Date.now()}`,
        title: detectedTitle || 'Mi Nuevo Manuscrito',
        subtitle: '',
        author: currentBook.author || 'Escritor',
        genre: 'Narrativa',
        tone: 'Literario',
        synopsis: 'Manuscrito importado a Pluma.',
        targetWords: Math.max(50000, chaptersToImport.reduce((acc, c) => acc + c.words, 0)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chapters: chaptersToImport.map((c, idx) => ({
          id: `chap-${Date.now()}-${idx}`,
          number: idx + 1,
          title: c.title || `Capítulo ${idx + 1}`,
          content: c.content,
          status: 'draft',
          updatedAt: new Date().toISOString(),
        })),
        characters: [],
        worldNotes: [],
      };
      onImportAsNewBook(newBook);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1a17] border border-[#38332b] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#38332b] bg-[#171512]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-medium text-stone-100 flex items-center gap-2">
                Subir o Importar Manuscrito
              </h3>
              <p className="text-xs text-stone-400">
                Trae tu obra a Pluma desde archivos Word (.docx/.txt), Markdown (.md) o texto copiado.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-800 bg-[#141210] px-6 gap-2">
          <button
            onClick={() => setActiveTab('file')}
            className={`py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            Subir Archivo Word (.docx), .txt o .md
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Pegar Texto Directamente
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'file' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-stone-700/80 hover:border-amber-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-stone-900/30 hover:bg-stone-900/60 transition-all group relative">
                <input
                  type="file"
                  accept=".docx,.doc,.txt,.md,.markdown,.json"
                  onChange={handleFileUpload}
                  disabled={isParsingDocx}
                  className="hidden"
                />

                {isParsingDocx ? (
                  <div className="flex flex-col items-center justify-center py-4 text-amber-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-sm font-semibold">
                      Extrayendo texto y capítulos del documento Word...
                    </span>
                    <span className="text-xs text-stone-400 mt-1">
                      Analizando la estructura y títulos de tu obra...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-stone-200 group-hover:text-amber-300">
                      {fileName ? fileName : 'Selecciona o arrastra tu archivo Word o texto aquí'}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                        Microsoft Word (.docx)
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700 font-medium">
                        Texto (.txt)
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                        Markdown (.md)
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 mt-2">
                      Detectaremos automáticamente los capítulos y títulos para organizar tu manuscrito.
                    </span>
                  </>
                )}
              </label>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-stone-300 block">
                Pega el contenido completo o fragmento de tu libro
              </label>
              <textarea
                rows={8}
                value={pastedText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="Pega aquí el texto de tu novela o capítulos..."
                className="w-full bg-stone-900/80 border border-stone-800 rounded-xl p-3.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/40 font-serif leading-relaxed"
              />
            </div>
          )}

          {/* Configuration options when text is loaded */}
          {rawContent && (
            <div className="space-y-4 pt-2 border-t border-stone-800 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-300">Título de la obra</label>
                  <input
                    type="text"
                    value={detectedTitle}
                    onChange={(e) => setDetectedTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-300">Destino de la importación</label>
                  <select
                    value={importDestination}
                    onChange={(e) => setImportDestination(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="new_book">Crear un Nuevo Libro independiente</option>
                    <option value="add_chapters">Añadir como nuevos capítulos a «{currentBook.title}»</option>
                    <option value="replace_chapter">Reemplazar contenido del capítulo actual</option>
                  </select>
                </div>
              </div>

              {/* Auto Split Option */}
              <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-medium text-stone-200 block">
                      División inteligente por capítulos
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Detecta automáticamente menciones como «Capítulo 1», «Capítulo 2», títulos o encabezados.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoSplit}
                  onChange={(e) => {
                    setAutoSplit(e.target.checked);
                    setDetectedChapters(parseChaptersFromText(rawContent));
                  }}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Detected chapters preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono">
                    Capítulos Detectados ({detectedChapters.length})
                  </span>
                  <span className="text-xs text-stone-500">
                    Total: {detectedChapters.reduce((acc, c) => acc + c.words, 0).toLocaleString()} palabras
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {detectedChapters.map((chap, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-lg bg-stone-900/90 border border-stone-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-stone-500 font-mono">#{idx + 1}</span>
                        <span className="text-stone-200 truncate font-medium">{chap.title}</span>
                      </div>
                      <span className="text-stone-400 font-mono text-[11px]">
                        {chap.words.toLocaleString()} pal.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#38332b] bg-[#171512]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={!rawContent.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            Importar al Estudio
          </button>
        </div>
      </div>
    </div>
  );
};
