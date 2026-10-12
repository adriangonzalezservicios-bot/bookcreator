import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Loader2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  HardDrive,
  FileJson,
  Clock,
  Check
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Book } from '../types/book';
import {
  googleSignIn,
  googleSignOut,
  getAccessToken,
  initAuth,
} from '../services/googleAuth';
import {
  uploadBackupToDrive,
  listDriveBackups,
  downloadBackupFromDrive,
  deleteBackupFromDrive,
  DriveBackupFile,
} from '../services/driveBackup';

interface DriveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  currentBook: Book;
  onRestoreBooks: (restored: Book[]) => void;
}

export const DriveBackupModal: React.FC<DriveBackupModalProps> = ({
  isOpen,
  onClose,
  books,
  currentBook,
  onRestoreBooks,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveBackupFile[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Confirmation state for restore (MANDATORY per skill guidelines)
  const [confirmRestoreFile, setConfirmRestoreFile] = useState<DriveBackupFile | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Confirmation state for delete
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<DriveBackupFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        if (token) setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
        setDriveFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch backups whenever we have an active token and modal is opened
  useEffect(() => {
    if (isOpen && accessToken) {
      loadBackups();
    }
  }, [isOpen, accessToken]);

  const loadBackups = async (tokenOverride?: string) => {
    const token = tokenOverride || accessToken;
    if (!token) return;
    setIsLoadingBackups(true);
    setStatusMessage(null);
    try {
      const files = await listDriveBackups(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Error al listar backups de Drive: ${err.message}`,
      });
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const { user, accessToken: token } = await googleSignIn();
      setCurrentUser(user);
      setAccessToken(token);
      setStatusMessage({
        type: 'success',
        text: `Conectado como ${user.displayName || user.email}`,
      });
      loadBackups(token);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error al conectar con Google Drive: ${err.message}`,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setCurrentUser(null);
    setAccessToken(null);
    setDriveFiles([]);
    setStatusMessage({
      type: 'info',
      text: 'Sesión de Google Drive cerrada.',
    });
  };

  const handleCreateBackup = async () => {
    if (!accessToken) {
      handleSignIn();
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);
    try {
      const res = await uploadBackupToDrive(books, accessToken, currentBook.title);
      setStatusMessage({
        type: 'success',
        text: `¡Copia de seguridad guardada con éxito en Google Drive! («${res.name}»)`,
      });
      await loadBackups();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Error al crear backup: ${err.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Explicit confirmation before mutating user data
  const handleConfirmRestore = async () => {
    if (!confirmRestoreFile || !accessToken) return;
    setIsRestoring(true);
    try {
      const restoredBooks = await downloadBackupFromDrive(confirmRestoreFile.id, accessToken);
      onRestoreBooks(restoredBooks);
      setStatusMessage({
        type: 'success',
        text: `¡Manuscritos restaurados correctamente desde «${confirmRestoreFile.name}»!`,
      });
      setConfirmRestoreFile(null);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error al restaurar: ${err.message}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteFile || !accessToken) return;
    setIsDeleting(true);
    try {
      await deleteBackupFromDrive(confirmDeleteFile.id, accessToken);
      setStatusMessage({
        type: 'success',
        text: 'Copia de seguridad eliminada de Google Drive.',
      });
      setConfirmDeleteFile(null);
      await loadBackups();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error al eliminar archivo: ${err.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1a17] border border-[#38332b] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#38332b] bg-[#171512]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Cloud className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-medium text-stone-100 flex items-center gap-2">
                Copia de Seguridad en Google Drive
              </h3>
              <p className="text-xs text-stone-400">
                Sincroniza y resguarda tu novela en la nube con tu cuenta de Google.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status feedback banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-stone-800 border border-stone-700 text-stone-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* Account Connection Card */}
          <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-stone-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-600/30 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300">
                    {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-stone-100 flex items-center gap-1.5">
                    {currentUser.displayName || 'Usuario de Google'}
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Conectado
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono">
                    {currentUser.email}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-xs font-semibold text-stone-200">
                  Conecta tu cuenta de Google
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Permite a la aplicación guardar copias de tu manuscrito en tu Google Drive.
                </p>
              </div>
            )}

            <div>
              {currentUser ? (
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-xl text-xs text-stone-400 hover:text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="gsi-material-button flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-stone-800 font-medium text-xs hover:bg-stone-100 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-4 h-4 animate-spin text-stone-700" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  )}
                  <span>Iniciar sesión con Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Backup Action Card */}
          <div className="bg-[#1e1b16] border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-amber-300 block mb-0.5">
                Copia Actual: «{currentBook.title}»
              </span>
              <p className="text-[11px] text-stone-400">
                Se guardará un archivo íntegro con todos los capítulos ({currentBook.chapters.length}), personajes ({currentBook.characters.length}) y notas.
              </p>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={isUploading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shrink-0"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Subiendo a Drive...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Hacer Backup en Google Drive
                </>
              )}
            </button>
          </div>

          {/* List of Backups in Google Drive */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5 font-mono">
                <HardDrive className="w-3.5 h-3.5 text-stone-500" />
                Copias Disponibles en Google Drive ({driveFiles.length})
              </span>
              {currentUser && (
                <button
                  onClick={() => loadBackups()}
                  disabled={isLoadingBackups}
                  className="text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                  Actualizar lista
                </button>
              )}
            </div>

            {isLoadingBackups ? (
              <div className="p-8 text-center text-xs text-stone-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                <span>Consultando archivos de copia en Google Drive...</span>
              </div>
            ) : driveFiles.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {driveFiles.map((file) => {
                  const dateStr = file.modifiedTime
                    ? new Date(file.modifiedTime).toLocaleString()
                    : 'Fecha desconocida';
                  const sizeKb = file.size
                    ? `${(parseInt(file.size, 10) / 1024).toFixed(1)} KB`
                    : '';

                  return (
                    <div
                      key={file.id}
                      className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 truncate min-w-0">
                        <FileJson className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="truncate">
                          <div className="font-medium text-stone-200 truncate">
                            {file.name}
                          </div>
                          <div className="text-[10px] text-stone-500 flex items-center gap-2 mt-0.5">
                            <span>{dateStr}</span>
                            {sizeKb && <span>• {sizeKb}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setConfirmRestoreFile(file)}
                          title="Restaurar este manuscrito"
                          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center gap-1 text-[11px] transition-colors"
                        >
                          <DownloadCloud className="w-3 h-3 text-emerald-400" />
                          Restaurar
                        </button>

                        <button
                          onClick={() => setConfirmDeleteFile(file)}
                          title="Eliminar de Google Drive"
                          className="p-1 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : currentUser ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-stone-900/30 border border-dashed border-stone-800 rounded-xl">
                No tienes copias previas de Pluma en Google Drive todavía. Haz clic arriba en «Hacer Backup en Google Drive» para crear tu primera copia.
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-stone-500 bg-stone-900/30 border border-dashed border-stone-800 rounded-xl">
                Conecta tu cuenta de Google arriba para ver y restaurar tus copias de seguridad de la nube.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[#38332b] bg-[#171512]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Restoring Data */}
      {confirmRestoreFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1c1a17] border border-amber-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-semibold text-stone-100">
                ¿Restaurar copia de seguridad?
              </h4>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Estás a punto de restaurar el manuscrito desde el archivo:{' '}
              <strong className="text-amber-300 font-mono block mt-1">
                {confirmRestoreFile.name}
              </strong>
            </p>

            <p className="text-xs text-stone-400 leading-relaxed">
              Esta acción actualizará tu biblioteca local con los capítulos y personajes guardados en esa copia. Asegúrate de haber guardado tus cambios actuales si son recientes.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setConfirmRestoreFile(null)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white transition-colors"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-3.5 h-3.5" />
                    Sí, restaurar manuscrito
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog for Deleting Data */}
      {confirmDeleteFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1c1a17] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-semibold text-stone-100">
                ¿Eliminar copia de seguridad de Drive?
              </h4>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              ¿Seguro que deseas eliminar definitivamente el archivo{' '}
              <strong className="text-rose-300 font-mono">
                {confirmDeleteFile.name}
              </strong>{' '}
              de tu Google Drive?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteFile(null)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar archivo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
