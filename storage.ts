import { Book, EditorSettings, ClaudeConfig } from '../types/book';

const STORAGE_KEY_BOOKS = 'pluma_books_v1';
const STORAGE_KEY_ACTIVE_BOOK = 'pluma_active_book_id_v1';
const STORAGE_KEY_EDITOR_SETTINGS = 'pluma_editor_settings_v1';
const STORAGE_KEY_CLAUDE_CONFIG = 'pluma_claude_config_v1';
const STORAGE_KEY_SESSION_WORDS = 'pluma_session_words_v1';

export const DEFAULT_BOOK: Book = {
  id: 'book-demo-1',
  title: 'El Susurro de las Mareas Olvidadas',
  subtitle: 'Una novela de secretos, niebla y memoria',
  author: 'Escritor',
  genre: 'Misterio & Realismo Mágico',
  tone: 'Atmosférico, poético con creciente tensión psicológica',
  synopsis: 'En un remoto pueblo costero donde el mar devuelve objetos que nunca debieron existir, una restauradora de manuscritos antiguos descubre una carta escrita con su propia caligrafía pero fechada cien años antes de su nacimiento. A medida que la marea viva de otoño se acerca, las campanas de una iglesia sumergida comienzan a tañer.',
  targetWords: 50000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  chapters: [
    {
      id: 'chap-1',
      number: 1,
      title: 'Capítulo 1: La salitre en los papeles',
      status: 'review',
      targetWords: 3500,
      notes: 'Establecer la atmósfera húmeda del taller, la rutina meticulosa de Elena y el hallazgo del manuscrito anacrónico.',
      updatedAt: new Date().toISOString(),
      content: `La lluvia sobre el tejado de zinc no caía: golpeaba como un puñado de arroz arrojado contra la chapa con rabia antigua.

Elena humedeció la punta de su pincel de pelo de marta con agua destilada y apartó una hebra de papel verjurado con la devoción de quien desactiva un artefacto dormido. En Puerto Umbría, el salitre no perdonaba nada. Se colaba por los marcos de las ventanas de tea, oxidaba las bisagras de latón y dejaba una costra pálida en los lomos encuadernados en piel de cordero.

—Si sigues respirando tan cerca de ese pergamino, acabarás bebiéndote la tinta, Elena —dijo don Mateo desde la trastienda, sin levantar la vista de su taza de café humeante.

Elena no contestó. Sabía que el viejo encuadernador hablaba por llenar el vacío, ese rumor sordo del Atlántico que nunca callaba del todo tras el acantilado. Sus dedos, manchados de hollín de carbón y cola de pescado, temblaron ligeramente al desdoblar el pliego central del códice recuperado de la ensenada.

No era pergamino común. Era vitela, fina como el ala de una polilla, y las líneas no estaban trazadas con tinta ferrogalica, sino con un pigmento azul profundo que brillaba como si la noche marina siguiera viva en su cauce.

Al pie de la última página, una firma en cursiva temblorosa, con el lazo de la «E» quebrado exactamente como el suyo:

«Para cuando el mar te devuelva mis ojos, Elena. Octubre de 1904.»

La ventana chasqueó con un golpe de viento súbito. Afuera, en la línea donde el horizonte tragaba el oleaje, una campana distante soltó un tañido solitario. Una campana donde solo había agua.`,
    },
    {
      id: 'chap-2',
      number: 2,
      title: 'Capítulo 2: El faro ciego',
      status: 'draft',
      targetWords: 3000,
      notes: 'Elena visita a Julián en el faro fuera de servicio. Diálogo tenso sobre el pasado familiar.',
      updatedAt: new Date().toISOString(),
      content: `El camino que ascendía hacia Punta de la Lanza olía a hinojo silvestre y a helecho empapado. Elena caminaba con el cuaderno apretado contra el pecho, envuelto en un paño de lino encerado para protegerlo de la llovizna pertinaz.

El faro se alzaba como un colmillo blanqueado contra un cielo de plomo. Había dejado de emitir luz treinta años atrás, cuando los barcos empezaron a fiarse del satélite y olvidaron los ojos de cristal de roca tallados en Francia.

Julián estaba en el umbral, calzado con botas de agua y una pipa apagada entre los dientes gastados.

—Te vi subir desde la curva de los cipreses —dijo, abriendo la puerta pesada de hierro pintada de verde oscuro—. Nadie sube aquí con lluvia a menos que traiga malas noticias o una pregunta que no se atreve a hacer en el muelle.

—No son malas noticias, Julián. Es algo peor.

—Pasa antes de que la humedad te pudra las ideas. El té está amargo, pero caliente.`,
    },
    {
      id: 'chap-3',
      number: 3,
      title: 'Capítulo 3: La marea que no retrocede',
      status: 'draft',
      targetWords: 4000,
      notes: 'Primera manifestación clara de que el tiempo en el pueblo no transcurre en línea recta.',
      updatedAt: new Date().toISOString(),
      content: `Esa medianoche, la marea no bajó.

Los pescadores del espigón se quedaron inmóviles en las banquetas del muelle viejo, con los cabos en la mano y los ojos clavados en las piedras verdes de verdín. Cada seis horas el océano debía respirar hondo y retirarse hacia las fosas, dejando al descubierto los esqueletos de madera de las viejas chalupas.

Pero a las dos de la madrugada el agua seguía lamiendo el segundo peldaño de la rampa de piedra. Tranquila, tibia, inmóvil como un espejo de azogue.`,
    },
  ],
  characters: [
    {
      id: 'char-1',
      name: 'Elena Varela',
      role: 'Protagonista',
      archetype: 'La investigadora escéptica herida por el pasado',
      goal: 'Comprender por qué su nombre y caligrafía aparecen en un manuscrito de hace un siglo y salvar el taller de su familia.',
      wound: 'La desaparición inexplicable de su madre durante una tormenta hace doce años, de la que aún se culpa.',
      physical: 'Mirada analítica, cabello castaño recogido con un lápiz de grafito, manos con pequeñas cicatrices de cortes de papel.',
      voice: 'Precisa, parca en palabras cuando está nerviosa, tiende a formular preguntas socráticas.',
      notes: 'Tiene una memoria eidética para la composición física de los libros antiguos.',
    },
    {
      id: 'char-2',
      name: 'Don Mateo',
      role: 'Mentor',
      archetype: 'El guardián sabio del oficio',
      goal: 'Proteger a Elena y mantener viva la memoria silenciosa de Puerto Umbría.',
      wound: 'Haber jurado hace décadas guardar silencio sobre la noche en que la iglesia del cabo se hundió bajo las aguas.',
      physical: 'Ochenta años, barba blanca recortada con tijeras de encuadernar, dedos nudosos cubiertos de manchas de vejez.',
      voice: 'Pausado, con refranes marineros y una ironía tierna.',
      notes: 'Conoce todos los archivos parroquiales y los secretos de cada familia del pueblo.',
    },
    {
      id: 'char-3',
      name: 'Julián el Farero',
      role: 'Aliado',
      archetype: 'El vigía solitario',
      goal: 'Registrar cada anomalía marina en su diario de navegación secreto.',
      wound: 'La pérdida de la tripulación de su hermano en el banco de arena de las Campanas.',
      physical: 'Alto, encorvado, piel curtida como cuero de buey, mirada penetrante.',
      voice: 'Áspera, directa, silencios prolongados antes de contestar.',
      notes: 'Guarda en lo alto del faro cartas náuticas que no concuerdan con ningún mapa oficial.',
    },
  ],
  worldNotes: [
    {
      id: 'world-1',
      title: 'Puerto Umbría',
      category: 'Lugar',
      content: 'Pueblo costero encajado entre acantilados de basalto negro y un bosque de castaños centenarios. La niebla entra todas las tardes a las cinco en punto como una pared sólida. Las casas tienen tejados de pizarra y puertas pintadas de alquitrán.',
    },
    {
      id: 'world-2',
      title: 'La Iglesia Sumergida de San Telmo',
      category: 'Lore / Historia',
      content: 'Construida en 1740 en un promontorio que cedió tras el gran terremoto del siglo XIX. Se encuentra a cuarenta metros bajo el agua de la ensenada. La leyenda dice que cuando sus campanas suenan, alguien de la superficie está recordando una vida que no ha vivido.',
    },
    {
      id: 'world-3',
      title: 'El Pigmento Azul Abisal',
      category: 'Objeto clave',
      content: 'Tinta extraída de un alga fosforescente que solo florece en las grietas submarinas durante los eclipses. No se borra con agua ni con fuego ligero; parece absorber la luz de las velas.',
    },
  ],
};

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  theme: 'dark',
  font: 'newsreader',
  fontSize: 18,
  lineSpacing: 'relaxed',
  pageWidth: 'medium',
  focusMode: false,
  typewriterMode: false,
  soundEffects: false,
};

export const DEFAULT_CLAUDE_CONFIG: ClaudeConfig = {
  persona: 'mentor',
};

// Storage getters and setters
export function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKS);
    if (!raw) {
      saveBooks([DEFAULT_BOOK]);
      return [DEFAULT_BOOK];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_BOOK];
  } catch (e) {
    console.error('Error cargando libros de localStorage:', e);
    try {
      const backup = JSON.parse(localStorage.getItem(`${STORAGE_KEY_BOOKS}_last_good`) || 'null');
      if (Array.isArray(backup) && backup.length) return backup;
    } catch { /* use the default if both copies are invalid */ }
    return [DEFAULT_BOOK];
  }
}

const STORAGE_BACKUP_KEY = `${STORAGE_KEY_BOOKS}_recovery_v1`;

export function saveBooks(books: Book[]): void {
  const serialized = JSON.stringify(books);
  try {
    // Recovery history is best-effort: never let a full backup quota block the primary save.
    const previous = localStorage.getItem(STORAGE_KEY_BOOKS);
    if (previous && previous !== serialized) {
      try {
        const history = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_BACKUP_KEY) || '[]'); } catch { return []; } })();
        history.unshift({ savedAt: new Date().toISOString(), data: previous });
        localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(history.slice(0, 2)));
      } catch (backupError) { console.warn('No se pudo rotar la copia de recuperación; se prioriza el guardado actual.', backupError); }
    }
    localStorage.setItem(STORAGE_KEY_BOOKS, serialized);
    try { localStorage.setItem(`${STORAGE_KEY_BOOKS}_last_good`, serialized); } catch (backupError) { console.warn('No se pudo actualizar la copia secundaria.', backupError); }
    window.dispatchEvent(new CustomEvent('claudewriter-save-status', { detail: { ok: true, savedAt: new Date().toISOString() } }));
  } catch (e) {
    console.error('Error guardando libros; intentando liberar espacio de las copias secundarias:', e);
    try {
      // When quota is exhausted, sacrifice recovery snapshots before losing the newest draft.
      localStorage.removeItem(STORAGE_BACKUP_KEY);
      localStorage.removeItem(`${STORAGE_KEY_BOOKS}_last_good`);
      localStorage.setItem(STORAGE_KEY_BOOKS, serialized);
      window.dispatchEvent(new CustomEvent('claudewriter-save-status', { detail: { ok: true, savedAt: new Date().toISOString(), warning: 'Se liberó espacio borrando copias de recuperación antiguas.' } }));
    } catch (retryError) {
      console.error('Falló también el guardado de emergencia:', retryError);
      window.dispatchEvent(new CustomEvent('claudewriter-save-status', { detail: { ok: false, message: 'No se pudo guardar. Exportá una copia de seguridad y liberá espacio del navegador.' } }));
    }
  }
}

export function exportRecoveryBackup(): string {
  return localStorage.getItem(`${STORAGE_KEY_BOOKS}_last_good`) || localStorage.getItem(STORAGE_KEY_BOOKS) || '[]';
}

export function getRecoverySnapshots(): Array<{ savedAt: string; data: string }> {
  try { return JSON.parse(localStorage.getItem(STORAGE_BACKUP_KEY) || '[]'); } catch { return []; }
}

export function loadActiveBookId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_BOOK) || DEFAULT_BOOK.id;
  } catch {
    return DEFAULT_BOOK.id;
  }
}

export function saveActiveBookId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_BOOK, id);
  } catch (e) {
    console.error(e);
  }
}

export function loadEditorSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EDITOR_SETTINGS);
    if (raw) return { ...DEFAULT_EDITOR_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_EDITOR_SETTINGS;
}

export function saveEditorSettings(settings: EditorSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_EDITOR_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

export function loadClaudeConfig(): ClaudeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLAUDE_CONFIG);
    if (raw) return { ...DEFAULT_CLAUDE_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CLAUDE_CONFIG;
}

export function saveClaudeConfig(config: ClaudeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CLAUDE_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
}

// Track words written today
export function getDailyWordsWritten(): number {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(`${STORAGE_KEY_SESSION_WORDS}_${today}`);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function addDailyWordsWritten(delta: number): number {
  if (delta <= 0) return getDailyWordsWritten();
  try {
    const today = new Date().toISOString().slice(0, 10);
    const current = getDailyWordsWritten();
    const updated = current + delta;
    localStorage.setItem(`${STORAGE_KEY_SESSION_WORDS}_${today}`, updated.toString());
    return updated;
  } catch {
    return 0;
  }
}

// Helper word count
export function countWords(text: string): number {
  if (!text) return 0;
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean ? clean.split(' ').length : 0;
}

export function estimateReadingTime(words: number): string {
  const minutes = Math.ceil(words / 220); // standard adult reading speed
  if (minutes < 1) return '< 1 min de lectura';
  if (minutes === 1) return '1 min de lectura';
  return `${minutes} min de lectura`;
}

// Export functions
export function exportBookAsMarkdown(book: Book): void {
  let md = `# ${book.title}\n`;
  if (book.subtitle) md += `### ${book.subtitle}\n\n`;
  md += `**Autor:** ${book.author}\n`;
  md += `**Género:** ${book.genre}\n`;
  md += `**Tono:** ${book.tone}\n\n`;
  md += `## Sinopsis\n${book.synopsis}\n\n---\n\n`;

  book.chapters.forEach((chap) => {
    md += `## ${chap.title}\n\n`;
    md += `${chap.content}\n\n---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${book.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_manuscrito.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportBookAsText(book: Book): void {
  let txt = `${book.title.toUpperCase()}\n`;
  if (book.subtitle) txt += `${book.subtitle}\n`;
  txt += `Por ${book.author}\n\n`;
  txt += `=================================================\n\n`;

  book.chapters.forEach((chap) => {
    txt += `\n${chap.title.toUpperCase()}\n\n`;
    txt += `${chap.content}\n\n`;
    txt += `* * *\n`;
  });

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${book.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportBackupJSON(books: Book[]): void {
  const jsonStr = JSON.stringify(books, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pluma_copia_seguridad_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
