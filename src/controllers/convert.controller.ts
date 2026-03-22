import { Request, Response, NextFunction } from 'express';
import { docxToPdf, pdfToDocx } from '../services/convert.service';
import { ValidationError } from '../utils/errors';

export const handleDocxToPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) throw new ValidationError('No file uploaded');

    const result = await docxToPdf(req.file.buffer, req.file.mimetype);
    const filename = req.file.originalname.replace(/\.(docx|doc)$/i, '.pdf');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(result.length),
    });
    res.send(result);
  } catch (err) {
    next(err);
  }
};

export const handlePdfToDocx = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) throw new ValidationError('No file uploaded');

    const result = await pdfToDocx(req.file.buffer, req.file.mimetype);
    const filename = req.file.originalname.replace(/\.pdf$/i, '.docx');

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(result.length),
    });
    res.send(result);
  } catch (err) {
    next(err);
  }
};
