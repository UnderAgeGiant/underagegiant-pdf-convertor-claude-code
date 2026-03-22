import { promisify } from 'util';
import libre from 'libreoffice-convert';
import { UnsupportedMediaError } from '../utils/errors';

const convertAsync = promisify(libre.convert);

const DOCX_MIMES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export async function docxToPdf(buffer: Buffer, mimetype: string): Promise<Buffer> {
  if (!DOCX_MIMES.includes(mimetype)) {
    throw new UnsupportedMediaError('Input must be a DOCX file to convert to PDF');
  }
  return (await convertAsync(buffer, '.pdf', undefined)) as Buffer;
}

export async function pdfToDocx(buffer: Buffer, mimetype: string): Promise<Buffer> {
  if (mimetype !== 'application/pdf') {
    throw new UnsupportedMediaError('Input must be a PDF file to convert to DOCX');
  }
  return (await convertAsync(buffer, '.docx', undefined)) as Buffer;
}
