export interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  status: 'draft' | 'review' | 'completed';
  notes?: string;
  targetWords?: number;
  updatedAt: string;
}

export interface Character {
  id: string;
  name: string;
  role: 'Protagonista' | 'Antagonista' | 'Coprotagonista' | 'Mentor' | 'Aliado' | 'Secundario';
  archetype?: string;
  goal?: string; // Lo que persigue conscientemente
  wound?: string; // Su herida, miedo o secreto
  physical?: string; // Rasgos físicos distintivos
  voice?: string; // Tono, léxico, peculiaridades de habla
  notes?: string;
}

export interface WorldNote {
  id: string;
  title: string;
  category: 'Lugar' | 'Lore / Historia' | 'Regla o Sistema' | 'Objeto clave' | 'Tema / Atmósfera';
  content: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  genre: string;
  tone: string;
  synopsis: string;
  targetWords: number;
  chapters: Chapter[];
  characters: Character[];
  worldNotes: WorldNote[];
  createdAt: string;
  updatedAt: string;
}

export interface ClaudeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionTag?: string;
}

export type PaperTheme = 'paper' | 'sepia' | 'dark' | 'midnight';
export type FontChoice = 'newsreader' | 'garamond' | 'sans' | 'mono';

export interface EditorSettings {
  theme: PaperTheme;
  font: FontChoice;
  fontSize: number; // 16 to 24
  lineSpacing: 'tight' | 'normal' | 'relaxed';
  pageWidth: 'narrow' | 'medium' | 'wide';
  focusMode: boolean;
  typewriterMode: boolean;
  soundEffects: boolean;
}

export interface ClaudeConfig {
  persona: 'mentor' | 'poetic' | 'strict' | 'creative';
  anthropicKey?: string;
}
