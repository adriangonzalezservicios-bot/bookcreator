import { Book, Chapter, Character } from '../types/book';

export interface BookContextPayload {
  title: string;
  genre: string;
  tone: string;
  synopsis: string;
  currentChapterTitle?: string;
  currentChapterContent?: string;
  characters?: Array<{ name: string; role: string; description?: string }>;
}

export function extractBookContext(book: Book, activeChapter?: Chapter): BookContextPayload {
  return {
    title: book.title,
    genre: book.genre,
    tone: book.tone,
    synopsis: book.synopsis,
    currentChapterTitle: activeChapter?.title,
    currentChapterContent: activeChapter?.content,
    characters: book.characters.map((c: Character) => ({
      name: c.name,
      role: c.role,
      description: `${c.archetype ? c.archetype + '. ' : ''}${c.goal ? 'Deseo: ' + c.goal + '. ' : ''}${c.wound ? 'Conflicto: ' + c.wound : ''}`,
    })),
  };
}

export async function sendMessageToClaude(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  bookContext?: BookContextPayload,
  anthropicKey?: string
): Promise<{ reply: string; provider?: string }> {
  const response = await fetch('/api/claude/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      bookContext,
      anthropicKey,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error del servidor (${response.status})`);
  }

  return response.json();
}

export type LiteraryActionType =
  | 'polish'
  | 'fix_grammar'
  | 'show_dont_tell'
  | 'continue'
  | 'dialogue'
  | 'poetic'
  | 'darker_tension'
  | 'brainstorm_twists'
  | 'critique'
  | 'character_suggest';

export async function executeClaudeAction(
  action: LiteraryActionType | 'custom',
  text: string,
  bookContext?: BookContextPayload,
  customPrompt?: string,
  anthropicKey?: string
): Promise<{ result: string; provider?: string }> {
  const response = await fetch('/api/claude/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      text,
      bookContext,
      customPrompt,
      anthropicKey,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error al ejecutar acción (${response.status})`);
  }

  return response.json();
}

export async function checkServerStatus(): Promise<{ ok: boolean; hasGeminiKey: boolean; hasOpenAIKey?: boolean; openaiModel?: string | null; model: string }> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Servidor no disponible');
    return await res.json();
  } catch (err: any) {
    return { ok: false, hasGeminiKey: false, hasOpenAIKey: false, model: 'desconectado' };
  }
}
