import React from 'react';
import { X, Trophy, BookOpen, Clock, Flame, BarChart2, CheckCircle2 } from 'lucide-react';
import { Book } from '../types/book';
import { countWords, estimateReadingTime } from '../utils/storage';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  dailyWords: number;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  book,
  dailyWords,
}) => {
  if (!isOpen) return null;

  const totalWords = book.chapters.reduce(
    (acc, chap) => acc + countWords(chap.content),
    0
  );
  const targetWords = book.targetWords || 50000;
  const progressPercent = Math.min(100, Math.round((totalWords / targetWords) * 100));
  const dailyGoal = 1000;
  const dailyProgress = Math.min(100, Math.round((dailyWords / dailyGoal) * 100));
  const totalReadingTime = estimateReadingTime(totalWords);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1a17] border border-[#38332b] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#38332b] bg-[#171512]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BarChart2 className="w-4 h-4" />
            </span>
            <h3 className="text-base font-medium text-stone-100">
              Estadísticas del Manuscrito
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-stone-400 text-xs mb-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Palabras totales
              </div>
              <div className="text-2xl font-semibold text-stone-100">
                {totalWords.toLocaleString()}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                de {targetWords.toLocaleString()} objetivo ({progressPercent}%)
              </div>
              <div className="w-full bg-stone-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-stone-400 text-xs mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Escrito hoy
              </div>
              <div className="text-2xl font-semibold text-stone-100">
                {dailyWords.toLocaleString()}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Meta diaria: {dailyGoal.toLocaleString()} palabras ({dailyProgress}%)
              </div>
              <div className="w-full bg-stone-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3 bg-stone-900/40 p-4 rounded-xl border border-stone-800/70 text-center">
            <div>
              <span className="text-xs text-stone-400 block mb-1">Capítulos</span>
              <span className="text-lg font-medium text-stone-200">{book.chapters.length}</span>
            </div>
            <div>
              <span className="text-xs text-stone-400 block mb-1">Lectura estimada</span>
              <span className="text-lg font-medium text-stone-200">{totalReadingTime}</span>
            </div>
            <div>
              <span className="text-xs text-stone-400 block mb-1">Personajes</span>
              <span className="text-lg font-medium text-stone-200">{book.characters.length}</span>
            </div>
          </div>

          {/* Chapters breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Desglose por Capítulos
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {book.chapters.map((chap, idx) => {
                const words = countWords(chap.content);
                return (
                  <div
                    key={chap.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-stone-900/60 border border-stone-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate max-w-[240px]">
                      <span className="text-stone-500 font-mono">#{idx + 1}</span>
                      <span className="text-stone-200 truncate">{chap.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-400">
                      <span className="capitalize text-[11px] px-1.5 py-0.5 rounded bg-stone-800">
                        {chap.status === 'completed'
                          ? 'Listo'
                          : chap.status === 'review'
                          ? 'En revisión'
                          : 'Borrador'}
                      </span>
                      <span className="font-mono text-stone-300">{words} pal.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[#38332b] bg-[#171512]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
