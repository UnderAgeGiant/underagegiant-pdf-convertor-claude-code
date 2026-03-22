import { Router } from 'express';
import multer from 'multer';
import { convertLimiter } from '../middleware/rate-limit';
import { handleDocxToPdf, handlePdfToDocx } from '../controllers/convert.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

router.post('/docx-to-pdf', convertLimiter, upload.single('file'), handleDocxToPdf);
router.post('/pdf-to-docx', convertLimiter, upload.single('file'), handlePdfToDocx);

export default router;
