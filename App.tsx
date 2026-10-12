import React, { useState, useEffect, useRef } from 'react';
import {
  Book,
  Chapter,
  Character,
  WorldNote,
  EditorSettings,
  ClaudeConfig,
} from './types/book';
import {
  loadBooks,
  saveBooks,
  loadActiveBookId,
  saveActiveBookId,
  loadEditorSettings,
  saveEditorSettings,
  loadClaudeConfig,
  saveClaudeConfig,
  getDailyWordsWritten,
  addDailyWordsWritten,
  countWords,
  DEFAULT_BOOK,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { HermesAssistant } from './components/HermesAssistant';
import { DiffModal } from './components/DiffModal';
import { CharacterModal } from './components/CharacterModal';
import { WorldNoteModal } from './components/WorldNoteModal';
import { BookSettingsModal } from './components/BookSettingsModal';
import { StatsModal } from './components/StatsModal';
import { ReadingMode } from './components/ReadingMode';
import { DriveBackupModal } from './components/DriveBackupModal';
import { ImportManuscriptModal } from './components/ImportManuscriptModal';
import { LiteraryActionType } from './services/claudeApi';
import { executeClaudeAction, extractBookContext } from './services/claudeApi';
import { Feather, BookOpen, Sparkles, SlidersHorizontal, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Cloud, Upload, Menu } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState<Book[]>(loadBooks);
  const [activeBookId, setActiveBookId] = useState<string>(loadActiveBookId);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(loadEditorSettings);
  const [claudeConfig, setClaudeConfig] = useState<ClaudeConfig>(loadClaudeConfig);
  const [dailyWords, setDailyWords] = useState<number>(getDailyWordsWritten);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());

  // Layout UI states: Hermes Assistant is hidden by default and deploys as hamburger drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [isDriveBackupOpen, setIsDriveBackupOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Modals state
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isBookSettingsOpen, setIsBookSettingsOpen] = useState(false);
  const [characterModalState, setCharacterModalState] = useState<{
    isOpen: boolean;
    character: Character | null;
  }>({ isOpen: false, character: null });
  const [worldNoteModalState, setWorldNoteModalState] = useState<{
    isOpen: boolean;
    note: WorldNote | null;
  }>({ isOpen: false, note: null });
  const [diffModalState, setDiffModalState] = useState<{
    isOpen: boolean;
    proposedText: string;
    actionTitle: string;
    originalText: string;
  }>({ isOpen: false, proposedText: '', actionTitle: '', originalText: '' });

  const [isActionLoading, setIsActionLoading] = useState(false);

  // Get current active book
  const currentBook = books.find((b) => b.id === activeBookId) || books[0] || DEFAULT_BOOK;

  // Active chapter state
  const [activeChapterId, setActiveChapterId] = useState<string>(() => {
    return currentBook.chapters[0]?.id || '';
  });

  // Ensure activeChapterId stays valid when book changes
  useEffect(() => {
    if (!currentBook.chapters.some((c) => c.id === activeChapterId)) {
      setActiveChapterId(currentBook.chapters[0]?.id || '');
    }
  }, [currentBook, activeChapterId]);

  const currentChapter =
    currentBook.chapters.find((c) => c.id === activeChapterId) ||
    currentBook.chapters[0] || {
      id: 'default',
      number: 1,
      title: 'Capítulo 1',
      content: '',
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };

  // Keep track of word count to calculate daily delta
  const previousWordsRef = useRef<number>(countWords(currentChapter.content));

  // Persist books to localStorage
  useEffect(() => {
    saveBooks(books);
    setLastSavedAt(new Date());
  }, [books]);

  // Persist active book ID
  useEffect(() => {
    saveActiveBookId(activeBookId);
  }, [activeBookId]);

  // Persist editor settings
  useEffect(() => {
    saveEditorSettings(editorSettings);
  }, [editorSettings]);

  // Persist Claude config
  useEffect(() => {
    saveClaudeConfig(claudeConfig);
  }, [claudeConfig]);

  // Handle chapter content or metadata updates
  const handleUpdateChapter = (updated: Partial<Chapter>) => {
    const newContent = updated.content !== undefined ? updated.content : currentChapter.content;
    const oldWordCount = previousWordsRef.current;
    const newWordCount = countWords(newContent);

    if (newWordCount > oldWordCount) {
      const delta = newWordCount - oldWordCount;
      const updatedDaily = addDailyWordsWritten(delta);
      setDailyWords(updatedDaily);
    }
    previousWordsRef.current = newWordCount;

    setBooks((prevBooks) =>
      prevBooks.map((b) => {
        if (b.id !== currentBook.id) return b;
        return {
          ...b,
          updatedAt: new Date().toISOString(),
          chapters: b.chapters.map((chap) => {
            if (chap.id !== currentChapter.id) return chap;
            return {
              ...chap,
              ...updated,
              updatedAt: new Date().toISOString(),
            };
          }),
        };
      })
    );
  };

  // Add chapter
  const handleAddChapter = () => {
    const nextNumber = currentBook.chapters.length + 1;
    const newChapter: Chapter = {
      id: `chap-${Date.now()}`,
      number: nextNumber,
      title: `Capítulo ${nextNumber}`,
      content: '',
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };

    setBooks((prevBooks) =>
      prevBooks.map((b) => {
        if (b.id !== currentBook.id) return b;
        return {
          ...b,
          updatedAt: new Date().toISOString(),
          chapters: [...b.chapters, newChapter],
        };
      })
    );
    setActiveChapterId(newChapter.id);
  };

  // Delete chapter
  const handleDeleteChapter = (chapterId: string) => {
    if (currentBook.chapters.length <= 1) {
      alert('Un libro debe contener al menos un capítulo.');
      return;
    }

    setBooks((prevBooks) =>
      prevBooks.map((b) => {
        if (b.id !== currentBook.id) return b;
        const remaining = b.chapters
          .filter((c) => c.id !== chapterId)
          .map((c, idx) => ({ ...c, number: idx + 1 }));
        return {
          ...b,
          updatedAt: new Date().toISOString(),
          chapters: remaining,
        };
      })
    );

    if (activeChapterId === chapterId) {
      const remainingChaps = currentBook.chapters.filter((c) => c.id !== chapterId);
      if (remainingChaps.length > 0) {
        setActiveChapterId(remainingChaps[0].id);
      }
    }
  };

  // Reorder chapter
  const handleReorderChapter = (chapterId: string, direction: 'up' | 'down') => {
    const index = currentBook.chapters.findIndex((c) => c.id === chapterId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentBook.chapters.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newChapters = [...currentBook.chapters];
    const [moved] = newChapters.splice(index, 1);
    newChapters.splice(targetIndex, 0, moved);

    const renumbered = newChapters.map((c, idx) => ({ ...c, number: idx + 1 }));

    setBooks((prevBooks) =>
      prevBooks.map((b) => {
        if (b.id !== currentBook.id) return b;
        return {
          ...b,
          updatedAt: new Date().toISOString(),
          chapters: renumbered,
        };
      })
    );
  };

  // Character operations
  const handleSaveCharacter = (char: Character) => {
    setBooks((prevBooks) =>
      prevBooks.map((b) => {
        if (b.id !== currentBook.id) return b;
        const exists = b.characters.some((c) => c.id === char.id);
        const characters = exists
          ? b.characters.map((c) => (c.id === char.id ? char : c))
          : [...b.characters, char];
        return { ...b, characters };
      })
    );
  };

  const handleDeleteCharacter = (charId: string) => {
    setBooks((prevBooks) =>
      prevBooks.map((b) => {
        if (b.id !== currentBook.id) return b;
        return {
          ...b,
          characters: b.characters.filter((c) => c.id !== charId),
        };
      })
    );
  };

  // World note operations
  const handleSaveWorldNote = (note: WorldNote) => {
    setBooks((prevBooks) =>
      prevBooks.map((b) => {
        if (b.id !== currentBook.id) return b;
        const exists = b.worldNotes.some((n) => n.id === note.id);
        const worldNotes = exists
          ? b.worldNotes.map((n) => (n.id === note.id ? note : n))
          : [...b.worldNotes, note];
        return { ...b, worldNotes };
      })
    );
  };

  const handleDeleteWorldNote = (noteId: string) => {
    setBooks((prevBooks) =>
      prevBooks.map((b) => {
        if (b.id !== currentBook.id) return b;
        return {
          ...b,
          worldNotes: b.worldNotes.filter((n) => n.id !== noteId),
        };
      })
    );
  };

  // Book operations
  const handleUpdateBook = (updatedBook: Book) => {
    setBooks((prevBooks) =>
      prevBooks.map((b) => (b.id === updatedBook.id ? updatedBook : b))
    );
  };

  const handleCreateNewBook = () => {
    const newBook: Book = {
      id: `book-${Date.now()}`,
      title: 'Nueva Obra',
      subtitle: '',
      author: 'Escritor',
      genre: 'Novela',
      tone: 'Literario y envolvente',
      synopsis: 'Premisa en desarrollo...',
      targetWords: 50000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: `chap-${Date.now()}`,
          number: 1,
          title: 'Capítulo 1: El comienzo',
          content: 'Escribe aquí la primera línea de tu libro...',
          status: 'draft',
          updatedAt: new Date().toISOString(),
        },
      ],
      characters: [],
      worldNotes: [],
    };

    setBooks((prev) => [newBook, ...prev]);
    setActiveBookId(newBook.id);
    setActiveChapterId(newBook.chapters[0].id);
    setIsBookSettingsOpen(true);
  };

  // Claude actions from inline selection or toolbar
  const handleTriggerClaudeAction = async (
    action: LiteraryActionType,
    text: string,
    title: string
  ) => {
    setIsActionLoading(true);
    try {
      const bookContext = extractBookContext(currentBook, currentChapter);
      const res = await executeClaudeAction(
        action,
        text,
        bookContext,
        undefined,
        claudeConfig.anthropicKey
      );

      setDiffModalState({
        isOpen: true,
        proposedText: res.result,
        actionTitle: title,
        originalText: text,
      });
    } catch (err: any) {
      alert(`Error con Hermes: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Apply proposed text from diff modal into chapter
  const handleApplyProposedText = (newText: string) => {
    const original = diffModalState.originalText;
    if (original && currentChapter.content.includes(original)) {
      const updatedContent = currentChapter.content.replace(original, newText);
      handleUpdateChapter({ content: updatedContent });
    } else {
      // If it was action on whole chapter or selection not exact, append or replace
      handleUpdateChapter({ content: newText });
    }
  };

  // Insert generated text at bottom of manuscript
  const handleInsertTextIntoChapter = (textToInsert: string) => {
    const separator = currentChapter.content ? '\n\n' : '';
    const updatedContent = `${currentChapter.content}${separator}${textToInsert}`;
    handleUpdateChapter({ content: updatedContent });
  };

  const handleToggleZenMode = () => {
    const nextZen = !isZenMode;
    setIsZenMode(nextZen);
    if (nextZen) {
      setIsSidebarOpen(false);
      setIsAssistantOpen(false);
    } else {
      setIsSidebarOpen(false);
      setIsAssistantOpen(false);
    }
  };

  // Assistant is hidden by default and deploys as a hamburger drawer.
  // When Hermes assistant opens, chapters list collapses so it can be deployed as a hamburger menu drawer.
  const handleToggleAssistant = () => {
    const next = !isAssistantOpen;
    setIsAssistantOpen(next);
    if (next) {
      setIsSidebarOpen(false);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121110] text-[#ded8cf] font-sans antialiased">
      {/* Print View for book manuscript exporting */}
      <div className="hidden print:block print-only p-8 text-black bg-white">
        <h1 className="text-3xl font-bold mb-2">{currentBook.title}</h1>
        {currentBook.subtitle && <h2 className="text-xl italic mb-4">{currentBook.subtitle}</h2>}
        <p className="text-sm text-gray-600 mb-8">Por {currentBook.author}</p>
        <div className="border-b border-gray-400 mb-8" />
        {currentBook.chapters.map((chap) => (
          <div key={chap.id} className="book-print-content mb-12">
            <h3 className="text-2xl font-semibold mb-4">{chap.title}</h3>
            <div className="whitespace-pre-wrap font-serif text-base leading-relaxed">
              {chap.content}
            </div>
          </div>
        ))}
      </div>

      {/* Main Workspace (Hidden during print) */}
      <div className="no-print flex w-full h-full overflow-hidden relative">
        {/* Left Sidebar: Chapters, Characters, Lore, Export */}
        <Sidebar
          book={currentBook}
          books={books}
          activeChapterId={currentChapter.id}
          onSelectChapter={setActiveChapterId}
          onAddChapter={handleAddChapter}
          onDeleteChapter={handleDeleteChapter}
          onReorderChapter={handleReorderChapter}
          onOpenBookSettings={() => setIsBookSettingsOpen(true)}
          onOpenStats={() => setIsStatsModalOpen(true)}
          onOpenCharacterModal={(char) => setCharacterModalState({ isOpen: true, character: char })}
          onOpenWorldModal={(note) => setWorldNoteModalState({ isOpen: true, note })}
          onSwitchBook={(id) => {
            setActiveBookId(id);
            const target = books.find((b) => b.id === id);
            if (target && target.chapters.length > 0) {
              setActiveChapterId(target.chapters[0].id);
            }
          }}
          onCreateNewBook={handleCreateNewBook}
          onImportBackup={(imported) => {
            setBooks(imported);
            if (imported.length > 0) {
              setActiveBookId(imported[0].id);
              setActiveChapterId(imported[0].chapters[0]?.id || '');
            }
          }}
          onOpenImportManuscript={() => setIsImportModalOpen(true)}
          onOpenReadingMode={() => setIsReadingMode(true)}
          onOpenDriveBackup={() => setIsDriveBackupOpen(true)}
          isOpen={isSidebarOpen}
          onToggle={handleToggleSidebar}
          isAssistantOpen={isAssistantOpen}
        />

        {/* Center: Main Book Editor */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
          <Editor
            chapter={currentChapter}
            book={currentBook}
            settings={editorSettings}
            onUpdateChapter={handleUpdateChapter}
            onUpdateSettings={(newSettings) =>
              setEditorSettings((prev) => ({ ...prev, ...newSettings }))
            }
            onTriggerClaudeAction={handleTriggerClaudeAction}
            isActionLoading={isActionLoading}
            isZenMode={isZenMode}
            onToggleZenMode={handleToggleZenMode}
            onOpenReadingMode={() => setIsReadingMode(true)}
            onOpenDriveBackup={() => setIsDriveBackupOpen(true)}
            onToggleChapters={handleToggleSidebar}
            onToggleAssistant={handleToggleAssistant}
            isAssistantOpen={isAssistantOpen}
            isChaptersOpen={isSidebarOpen}
            lastSavedAt={lastSavedAt}
            dailyWords={dailyWords}
          />
        </div>

        {/* Slide-over Drawer: Hermes Assistant (God of Literature and Eloquence) */}
        <HermesAssistant
          book={currentBook}
          currentChapter={currentChapter}
          claudeConfig={claudeConfig}
          onUpdateClaudeConfig={setClaudeConfig}
          onInsertTextIntoChapter={handleInsertTextIntoChapter}
          onPreviewDiff={(proposed, title, original) =>
            setDiffModalState({
              isOpen: true,
              proposedText: proposed,
              actionTitle: title,
              originalText: original || currentChapter.content,
            })
          }
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          onToggleChapters={handleToggleSidebar}
          isChaptersOpen={isSidebarOpen}
        />
      </div>

      {/* Modals */}
      <DiffModal
        isOpen={diffModalState.isOpen}
        onClose={() => setDiffModalState((prev) => ({ ...prev, isOpen: false }))}
        originalText={diffModalState.originalText}
        proposedText={diffModalState.proposedText}
        actionTitle={diffModalState.actionTitle}
        onApply={handleApplyProposedText}
      />

      <CharacterModal
        isOpen={characterModalState.isOpen}
        onClose={() => setCharacterModalState({ isOpen: false, character: null })}
        character={characterModalState.character}
        book={currentBook}
        onSave={handleSaveCharacter}
        onDelete={handleDeleteCharacter}
      />

      <WorldNoteModal
        isOpen={worldNoteModalState.isOpen}
        onClose={() => setWorldNoteModalState({ isOpen: false, note: null })}
        note={worldNoteModalState.note}
        onSave={handleSaveWorldNote}
        onDelete={handleDeleteWorldNote}
      />

      <BookSettingsModal
        isOpen={isBookSettingsOpen}
        onClose={() => setIsBookSettingsOpen(false)}
        book={currentBook}
        onSave={handleUpdateBook}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        book={currentBook}
        dailyWords={dailyWords}
      />

      {/* Fullscreen Reading Mode (No editing controls, centered typography, spacing controls) */}
      {isReadingMode && (
        <ReadingMode
          chapter={currentChapter}
          book={currentBook}
          onClose={() => setIsReadingMode(false)}
          onSelectChapter={setActiveChapterId}
        />
      )}

      {/* Google Drive Backup & Cloud Restore Modal */}
      <DriveBackupModal
        isOpen={isDriveBackupOpen}
        onClose={() => setIsDriveBackupOpen(false)}
        books={books}
        currentBook={currentBook}
        onRestoreBooks={(restored) => {
          setBooks(restored);
          if (restored.length > 0) {
            setActiveBookId(restored[0].id);
            setActiveChapterId(restored[0].chapters[0]?.id || '');
          }
        }}
      />

      {/* Import / Upload Manuscript Modal */}
      <ImportManuscriptModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentBook={currentBook}
        currentChapter={currentChapter}
        onImportAsNewBook={(newBook) => {
          setBooks((prev) => [newBook, ...prev]);
          setActiveBookId(newBook.id);
          setActiveChapterId(newBook.chapters[0]?.id || '');
        }}
        onImportChaptersToCurrentBook={(newChapters) => {
          setBooks((prev) =>
            prev.map((b) => {
              if (b.id !== currentBook.id) return b;
              return {
                ...b,
                chapters: [...b.chapters, ...newChapters],
                updatedAt: new Date().toISOString(),
              };
            })
          );
          if (newChapters.length > 0) {
            setActiveChapterId(newChapters[0].id);
          }
        }}
        onReplaceCurrentChapter={(content, title) => {
          handleUpdateChapter({ content, ...(title ? { title } : {}) });
        }}
        onImportBackupJSON={(restored) => {
          setBooks(restored);
          if (restored.length > 0) {
            setActiveBookId(restored[0].id);
            setActiveChapterId(restored[0].chapters[0]?.id || '');
          }
        }}
      />
    </div>
  );
}
