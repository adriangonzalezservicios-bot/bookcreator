import { Book } from '../types/book';

export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export async function uploadBackupToDrive(
  books: Book[],
  accessToken: string,
  bookTitle?: string
): Promise<{ id: string; name: string }> {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safeTitle = (bookTitle || 'Biblioteca')
    .replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const fileName = `Pluma_Backup_${safeTitle}_${dateStr}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `Copia de seguridad de Pluma Estudio de Escritura (${books.length} obra/s) - ${new Date().toLocaleString()}`,
  };

  const payload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    source: 'Pluma Estudio de Escritura',
    books,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(payload, null, 2) +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error subiendo a Google Drive (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return { id: result.id, name: result.name };
}

export async function listDriveBackups(accessToken: string): Promise<DriveBackupFile[]> {
  const query = encodeURIComponent("name contains 'Pluma_Backup' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,createdTime,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error consultando backups en Drive: ${err}`);
  }

  const data = await response.json();
  return data.files || [];
}

export async function downloadBackupFromDrive(
  fileId: string,
  accessToken: string
): Promise<Book[]> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error descargando backup de Drive: ${err}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.books)) {
    return data.books;
  }
  throw new Error('El archivo descargado no tiene una estructura de manuscrito válida.');
}

export async function deleteBackupFromDrive(
  fileId: string,
  accessToken: string
): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error eliminando archivo de Drive: ${err}`);
  }
}
