import { expect } from 'chai';
import sinon from 'sinon';
import libre from 'libreoffice-convert';
import { docxToPdf, pdfToDocx } from '../../src/services/convert.service';
import { UnsupportedMediaError } from '../../src/utils/errors';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOC_MIME = 'application/msword';
const PDF_MIME = 'application/pdf';

describe('ConvertService', () => {
  let libreStub: sinon.SinonStub;

  beforeEach(() => {
    libreStub = sinon.stub(libre, 'convertWithOptions');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('docxToPdf()', () => {
    it('should convert a DOCX file to PDF', async () => {
      const inputBuffer = Buffer.from('fake docx content');
      const outputBuffer = Buffer.from('fake pdf content');

      libreStub.callsFake((_buf, _ext, _filter, _opts, cb) => cb(null, outputBuffer));

      const result = await docxToPdf(inputBuffer, DOCX_MIME);

      expect(result).to.deep.equal(outputBuffer);
      expect(libreStub.calledOnce).to.be.true;
      expect(libreStub.firstCall.args[1]).to.equal('pdf');
    });

    it('should accept application/msword mimetype', async () => {
      const outputBuffer = Buffer.from('fake pdf');
      libreStub.callsFake((_buf, _ext, _filter, _opts, cb) => cb(null, outputBuffer));

      const result = await docxToPdf(Buffer.from('doc'), DOC_MIME);
      expect(result).to.deep.equal(outputBuffer);
    });

    it('should throw UnsupportedMediaError for non-DOCX input', async () => {
      try {
        await docxToPdf(Buffer.from('data'), PDF_MIME);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(UnsupportedMediaError);
        expect((err as UnsupportedMediaError).statusCode).to.equal(415);
      }
    });

    it('should throw UnsupportedMediaError for unsupported mimetype', async () => {
      try {
        await docxToPdf(Buffer.from('data'), 'image/png');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(UnsupportedMediaError);
      }
    });

    it('should propagate libreoffice conversion errors', async () => {
      libreStub.callsFake((_buf, _ext, _filter, _opts, cb) =>
        cb(new Error('LibreOffice not found'))
      );

      try {
        await docxToPdf(Buffer.from('docx'), DOCX_MIME);
        expect.fail('Should have thrown');
      } catch (err) {
        expect((err as Error).message).to.equal('LibreOffice not found');
      }
    });
  });

  describe('pdfToDocx()', () => {
    it('should convert a PDF file to DOCX', async () => {
      const inputBuffer = Buffer.from('fake pdf content');
      const outputBuffer = Buffer.from('fake docx content');

      libreStub.callsFake((_buf, _ext, _filter, _opts, cb) => cb(null, outputBuffer));

      const result = await pdfToDocx(inputBuffer, PDF_MIME);

      expect(result).to.deep.equal(outputBuffer);
      expect(libreStub.calledOnce).to.be.true;
      expect(libreStub.firstCall.args[1]).to.equal('docx');
    });

    it('should throw UnsupportedMediaError for non-PDF input', async () => {
      try {
        await pdfToDocx(Buffer.from('data'), DOCX_MIME);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(UnsupportedMediaError);
        expect((err as UnsupportedMediaError).statusCode).to.equal(415);
      }
    });

    it('should throw UnsupportedMediaError for unsupported mimetype', async () => {
      try {
        await pdfToDocx(Buffer.from('data'), 'text/plain');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(UnsupportedMediaError);
      }
    });

    it('should propagate libreoffice conversion errors', async () => {
      libreStub.callsFake((_buf, _ext, _filter, _opts, cb) =>
        cb(new Error('Conversion failed'))
      );

      try {
        await pdfToDocx(Buffer.from('pdf'), PDF_MIME);
        expect.fail('Should have thrown');
      } catch (err) {
        expect((err as Error).message).to.equal('Conversion failed');
      }
    });
  });
});
