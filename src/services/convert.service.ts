import { promisify } from 'util';
import libre from 'libreoffice-convert';
import { UnsupportedMediaError } from '../utils/errors';

const DOCX_MIMES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

// Lazily promisify so sinon stubs on libre.convert are picked up in tests
function getConverter() {
  return promisify(libre.convert);
}

export async function docxToPdf(buffer: Buffer, mimetype: string): Promise<Buffer> {
  if (!DOCX_MIMES.includes(mimetype)) {
    throw new UnsupportedMediaError('Input must be a DOCX file to convert to PDF');
  }
  return (await getConverter()(buffer, '.pdf', undefined)) as Buffer;
}

export async function pdfToDocx(buffer: Buffer, mimetype: string): Promise<Buffer> {
  if (mimetype !== 'application/pdf') {
    throw new UnsupportedMediaError('Input must be a PDF file to convert to DOCX');
  }
  return (await getConverter()(buffer, '.docx', undefined)) as Buffer;
}
