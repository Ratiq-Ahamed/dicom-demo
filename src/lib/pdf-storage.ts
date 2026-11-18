const DATABASE = 'dicom-demo-pdfs';
const STORE = 'reports';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('PDF storage is unavailable. Please allow browser storage and retry.'));
  });
}

async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = operation(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(new Error('Could not store or read this PDF. Browser storage may be full or unavailable.')); };
  });
}

export async function validatePDF(blob: Blob) {
  if (!blob.size || blob.size > 100 * 1024 * 1024) throw new Error('Choose a PDF up to 100 MB.');
  const header = new TextDecoder().decode(await blob.slice(0, 5).arrayBuffer());
  if (header !== '%PDF-') throw new Error('This file is not a valid PDF document.');
}

export async function savePDF(id: string, blob: Blob) {
  await validatePDF(blob);
  await transaction('readwrite', store => store.put(new Blob([blob], { type: 'application/pdf' }), id));
}
export async function readPDF(id: string): Promise<Blob> {
  const value = await transaction('readonly', store => store.get(id));
  if (!(value instanceof Blob)) throw new Error('This uploaded PDF is unavailable in this browser. Ask for a new report version; a sample will not replace it.');
  return value;
}
export const deletePDF = (id: string) => transaction('readwrite', store => store.delete(id));
export const clearPDFs = () => transaction('readwrite', store => store.clear());
