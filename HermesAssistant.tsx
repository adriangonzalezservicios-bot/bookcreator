import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  MessageSquare,
  Wand2,
  Lightbulb,
  CheckCheck,
  RotateCcw,
  Copy,
  ChevronDown,
  Key,
  ShieldCheck,
  Bot,
  Flame,
  Loader2,
  BookMarked,
  ArrowRight,
  Maximize2,
  Check,
  Feather,
  Menu,
  X
} from 'lucide-react';
import { Book, Chapter, ClaudeMessage, ClaudeConfig } from '../types/book';
import {
  sendMessageToClaude,
  executeClaudeAction,
  extractBookContext,
  LiteraryActionType,
} from '../services/claudeApi';

interface HermesAssistantProps {
  book: Book;
  currentChapter: Chapter;
  claudeConfig: ClaudeConfig;
  onUpdateClaudeConfig: (config: ClaudeConfig) => void;
  onInsertTextIntoChapter: (text: string) => void;
  onPreviewDiff: (proposedText: string, actionTitle: string, originalText?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onToggleChapters?: () => void;
  isChaptersOpen?: boolean;
}

export const HermesAssistant: React.FC<HermesAssistantProps> = ({
  book,
  currentChapter,
  claudeConfig,
  onUpdateClaudeConfig,
  onInsertTextIntoChapter,
  onPreviewDiff,
  isOpen,
  onClose,
  onToggleChapters,
  isChaptersOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'workshop' | 'inspire' | 'config'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ClaudeMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Saludos, autor. Soy Hermes, dios griego de la literatura y la elocuencia (en verdad el ingenio veloz de Gémini ataviado con las más finas plumas de Claude) al servicio de «${book.title}». 

Tengo presente la sinopsis, tus personajes y lo que estás narrando en el capítulo actual. ¿En qué te gustaría que nos enfoquemos hoy? Podemos pulir el ritmo de una escena, resolver un bloqueo de trama, afilar diálogos o hacer una lectura editorial profunda.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // ESC key to close assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ClaudeMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      const bookContext = extractBookContext(book, currentChapter);
      const conversationHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendMessageToClaude(
        conversationHistory,
        bookContext,
        claudeConfig.anthropicKey
      );

      const assistantMsg: ClaudeMessage = {
        id: `msg-resp-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Disculpa, hubo un problema al consultar a Hermes: ${err.message}. Por favor intenta de nuevo.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAction = async (action: LiteraryActionType, title: string, customText?: string) => {
    setActionLoading(title);
    try {
      const bookContext = extractBookContext(book, currentChapter);
      const targetText = customText || currentChapter.content;

      const res = await executeClaudeAction(
        action,
        targetText,
        bookContext,
        undefined,
        claudeConfig.anthropicKey
      );

      // If critique or twists, display in chat
      if (action === 'critique' || action === 'brainstorm_twists' || action === 'character_suggest') {
        setActiveTab('chat');
        setMessages((prev) => [
          ...prev,
          {
            id: `action-req-${Date.now()}`,
            role: 'user',
            content: `Solicito a Hermes: ${title}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          {
            id: `action-res-${Date.now()}`,
            role: 'assistant',
            content: res.result,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTag: title,
          },
        ]);
      } else {
        // Open Diff Modal for review
        onPreviewDiff(res.result, title, targetText);
      }
    } catch (err: any) {
      alert(`Error en la consulta con Hermes: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer Menu */}
      <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] md:w-[480px] bg-[#161412] border-l border-[#2d2822] text-stone-300 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 select-none">
        {/* Assistant Header */}
        <div className="p-4 border-b border-[#2d2822] bg-[#1a1714]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/25 via-amber-600/30 to-amber-700/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                <Feather className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-stone-100 tracking-wide font-display">Hermes</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Dios de la Literatura
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Gémini disfrazado de Claude · Mentor literario
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onToggleChapters && (
                <button
                  onClick={onToggleChapters}
                  title="Abrir menú de capítulos"
                  className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-colors ${
                    isChaptersOpen
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/80 border-stone-800'
                  }`}
                >
                  <Menu className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-medium hidden sm:inline">Capítulos</span>
                </button>
              )}

              <button
                onClick={onClose}
                title="Cerrar asistente (ESC)"
                className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Chapter Status Pill */}
          <div className="mt-2.5 flex items-center justify-between px-2.5 py-1 rounded-xl bg-[#121110] border border-stone-800/80 text-[11px]">
            <div className="flex items-center gap-1.5 truncate text-stone-400">
              <BookMarked className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
              <span className="truncate text-stone-300">
                Capítulo {currentChapter.number}: {currentChapter.title}
              </span>
            </div>
            {onToggleChapters && (
              <button
                onClick={onToggleChapters}
                className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline shrink-0 ml-2"
              >
                Cambiar capítulo
              </button>
            )}
          </div>

          {/* Tab switcher */}
          <div className="grid grid-cols-4 gap-1 mt-3 bg-[#121110] p-1 rounded-xl border border-stone-800/80 text-xs">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                activeTab === 'chat'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Diálogo
            </button>
            <button
              onClick={() => setActiveTab('workshop')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                activeTab === 'workshop'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Taller
            </button>
            <button
              onClick={() => setActiveTab('inspire')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                activeTab === 'inspire'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Musa
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                activeTab === 'config'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              Motor
            </button>
          </div>
        </div>

        {/* Tab 1: Interactive Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar select-text">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-stone-500">
                    <span>{m.role === 'user' ? 'Tú (Autor)' : 'Hermes'}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[92%] whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-amber-600/90 text-white rounded-tr-xs shadow-md'
                        : 'bg-[#1c1a17] border border-[#38332b] text-stone-200 rounded-tl-xs shadow-sm font-serif text-[13px]'
                    }`}
                  >
                    {m.actionTag && (
                      <div className="mb-2 pb-1.5 border-b border-stone-800 text-[10px] text-amber-400 font-mono flex items-center gap-1 font-sans">
                        <Sparkles className="w-3 h-3" />
                        {m.actionTag}
                      </div>
                    )}

                    {m.content}

                    {m.role === 'assistant' && m.id !== 'welcome' && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-800/80 font-sans text-[11px]">
                        <button
                          onClick={() => handleCopyMessage(m.id, m.content)}
                          className="text-stone-400 hover:text-stone-200 flex items-center gap-1 transition-colors"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copiar
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => onInsertTextIntoChapter(m.content)}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 ml-auto transition-colors"
                        >
                          <ArrowRight className="w-3 h-3" />
                          Insertar al manuscrito
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 p-3 text-xs text-amber-400/80 bg-amber-500/5 rounded-xl border border-amber-500/10">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Hermes está invocando la inspiración para tu obra...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Prompt sparks */}
            <div className="px-3 py-2 border-t border-[#2d2822] bg-[#141210] flex gap-1.5 overflow-x-auto custom-scrollbar">
              {[
                '¿Cómo intensificar la tensión aquí?',
                'Revisa si el ritmo decae en este capítulo',
                'Sugiere un dilema moral para el protagonista',
                '¿Los diálogos suenan naturales?',
              ].map((spark, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(spark)}
                  disabled={isLoading}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800 hover:border-amber-500/40 text-stone-400 hover:text-stone-200 whitespace-nowrap transition-colors"
                >
                  {spark}
                </button>
              ))}
            </div>

            {/* Chat input */}
            <div className="p-3 border-t border-[#2d2822] bg-[#161412]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  rows={2}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Pregunta a Hermes sobre trama, ritmo, diálogos..."
                  className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/50 resize-none"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 transition-colors shrink-0 shadow-lg shadow-amber-900/30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Workshop & Deep Corrections */}
        {activeTab === 'workshop' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed">
              <span className="font-semibold block mb-0.5">Taller Editorial de Hermes</span>
              Aplica el juicio y la precisión de Hermes directamente sobre el capítulo activo o tu selección.
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleRunAction('critique', 'Lectura Editorial Completa')}
                disabled={!!actionLoading}
                className="w-full text-left p-3.5 rounded-xl bg-[#1c1a17] hover:bg-[#23201c] border border-amber-500/30 hover:border-amber-500/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-100 flex items-center gap-1.5 group-hover:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Lectura Editorial Completa
                  </span>
                  {actionLoading === 'Lectura Editorial Completa' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400 leading-normal">
                  Diagnóstico profesional de puntos fuertes, cadencia, arco de tensión y áreas a pulir.
                </p>
              </button>

              <button
                onClick={() => handleRunAction('fix_grammar', 'Corrección Ortotipográfica')}
                disabled={!!actionLoading}
                className="w-full text-left p-3 rounded-xl bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200">
                    🔍 Corrector Ortotipográfico Riguroso
                  </span>
                  {actionLoading === 'Corrección Ortotipográfica' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Acentuación, comas criminales, concordancia y signos de diálogo españoles (—).
                </p>
              </button>

              <button
                onClick={() => handleRunAction('show_dont_tell', 'Mostrar, no contar')}
                disabled={!!actionLoading}
                className="w-full text-left p-3 rounded-xl bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200">
                    👁️ Transformador «Mostrar, no decir»
                  </span>
                  {actionLoading === 'Mostrar, no contar' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Convierte explicaciones abstractas en sensaciones corporales y detalles vivos.
                </p>
              </button>

              <button
                onClick={() => handleRunAction('dialogue', 'Afilar Diálogos')}
                disabled={!!actionLoading}
                className="w-full text-left p-3 rounded-xl bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200">
                    💬 Taller de Diálogos y Subtexto
                  </span>
                  {actionLoading === 'Afilar Diálogos' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Elimina acartonamiento, añade pausas elocuentes y lenguaje corporal revelador.
                </p>
              </button>

              <button
                onClick={() => handleRunAction('poetic', 'Cadencia Lírica')}
                disabled={!!actionLoading}
                className="w-full text-left p-3 rounded-xl bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200">
                    🎨 Enriquecer Prosa & Cadencia Lírica
                  </span>
                  {actionLoading === 'Cadencia Lírica' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Aumenta la belleza metafórica y musicalidad sin sobrecargar el estilo.
                </p>
              </button>

              <button
                onClick={() => handleRunAction('darker_tension', 'Acelerar Tensión')}
                disabled={!!actionLoading}
                className="w-full text-left p-3 rounded-xl bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200">
                    ⚡ Inyectar Tensión & Suspense
                  </span>
                  {actionLoading === 'Acelerar Tensión' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Frases más cortas y punzantes, atmósfera opresiva y urgencia dramática.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Inspiration & Twists */}
        {activeTab === 'inspire' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300/90 leading-relaxed">
              <span className="font-semibold block mb-0.5">Musa Creativa & Desbloqueo</span>
              Si te has detenido frente a la página en blanco o no sabes cómo desatar el nudo, usa estas chispas narrativas.
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleRunAction('brainstorm_twists', 'Giros Argumentales Inesperados')}
                disabled={!!actionLoading}
                className="w-full text-left p-3.5 rounded-xl bg-[#1c1a17] hover:bg-[#23201c] border border-orange-500/30 hover:border-orange-500/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-100 flex items-center gap-1.5 group-hover:text-orange-300">
                    🎲 Proponer 3 Giros Inesperados
                  </span>
                  {actionLoading === 'Giros Argumentales Inesperados' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400 leading-normal">
                  Complicaciones y revelaciones que desafíen los planes del protagonista.
                </p>
              </button>

              <button
                onClick={() => handleRunAction('continue', 'Continuar Escena')}
                disabled={!!actionLoading}
                className="w-full text-left p-3 rounded-xl bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200">
                    🚀 Continuar la escena desde aquí
                  </span>
                  {actionLoading === 'Continuar Escena' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Hermes escribe las siguientes 250 palabras siguiendo fielmente tu tono para reactivar tu flujo.
                </p>
              </button>

              <button
                onClick={() =>
                  handleSendMessage(
                    'Describe en detalle los estímulos sensoriales (olores peculiares, crujidos, temperatura de la luz) que enriquecerían este escenario en Puerto Umbría.'
                  )
                }
                disabled={isLoading}
                className="w-full text-left p-3 rounded-xl bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200">
                    🌌 Lluvia de Detalles Atmosféricos
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Olores, texturas y sonidos específicos que anclan al lector en el mundo.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Config & Engine */}
        {activeTab === 'config' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
            {/* Disguise Explanation Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#1c1a17] to-amber-950/20 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-semibold text-stone-100">Hermes: Gémini disfrazado de Claude</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                  {claudeConfig.anthropicKey ? 'Anthropic Activo' : 'Gémini Literario'}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Hermes rinde homenaje al dios griego del verbo y la elocuencia. En su núcleo late la gran potencia y rapidez de <strong>Google Gemini</strong>, calibrado para hablar, analizar y corregir con la profunda sensibilidad estilística y elegancia de <strong>Claude</strong>.
              </p>
            </div>

            {/* Persona selector */}
            <div className="space-y-2">
              <label className="text-stone-300 font-medium block">
                Voz de Hermes como Mentor
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'mentor', label: 'Mentor Cálido', desc: 'Constructivo y paciente' },
                  { id: 'strict', label: 'Crítico Exigente', desc: 'Rigor editorial implacable' },
                  { id: 'poetic', label: 'Musa Estilista', desc: 'Enfoque en belleza lírica' },
                  { id: 'creative', label: 'Estratega de Trama', desc: 'Enfoque en giros y ritmo' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      onUpdateClaudeConfig({
                        ...claudeConfig,
                        persona: p.id as any,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      claudeConfig.persona === p.id
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <div className="font-semibold text-stone-200 text-xs">{p.label}</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Anthropic Key */}
            <div className="space-y-2.5 pt-2 border-t border-stone-800">
              <label className="text-stone-300 font-medium block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  API Key Personal (Opcional)
                </span>
                {claudeConfig.anthropicKey && (
                  <button
                    onClick={() => onUpdateClaudeConfig({ ...claudeConfig, anthropicKey: '' })}
                    className="text-[10px] text-rose-400 hover:text-rose-300"
                  >
                    Eliminar clave
                  </button>
                )}
              </label>
              <input
                type="password"
                value={claudeConfig.anthropicKey || ''}
                onChange={(e) =>
                  onUpdateClaudeConfig({
                    ...claudeConfig,
                    anthropicKey: e.target.value.trim(),
                  })
                }
                placeholder="sk-ant-api03-..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
