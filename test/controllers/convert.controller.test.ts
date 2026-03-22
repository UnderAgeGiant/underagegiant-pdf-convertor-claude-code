import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import * as convertService from '../../src/services/convert.service';
import { handleDocxToPdf, handlePdfToDocx } from '../../src/controllers/convert.controller';
import { ValidationError, UnsupportedMediaError } from '../../src/utils/errors';

function mockRes() {
  const res: Partial<Response> = {};
  res.set = sinon.stub().returns(res);
  res.send = sinon.stub().returns(res);
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res as Response;
}

describe('ConvertController', () => {
  let next: sinon.SinonStub;

  beforeEach(() => {
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('handleDocxToPdf()', () => {
    it('should call next with ValidationError when no file is provided', async () => {
      const req = {} as Request;
      const res = mockRes();

      await handleDocxToPdf(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(ValidationError);
    });

    it('should return PDF buffer with correct headers on success', async () => {
      const pdfBuffer = Buffer.from('pdf output');
      sinon.stub(convertService, 'docxToPdf').resolves(pdfBuffer);

      const req = {
        file: {
          originalname: 'document.docx',
          buffer: Buffer.from('docx input'),
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      } as unknown as Request;
      const res = mockRes();

      await handleDocxToPdf(req, res, next);

      expect(next.called).to.be.false;
      expect((res.set as sinon.SinonStub).calledOnce).to.be.true;

      const headers = (res.set as sinon.SinonStub).firstCall.args[0];
      expect(headers['Content-Type']).to.equal('application/pdf');
      expect(headers['Content-Disposition']).to.equal('attachment; filename="document.pdf"');
      expect((res.send as sinon.SinonStub).calledWith(pdfBuffer)).to.be.true;
    });

    it('should strip .doc extension correctly in filename', async () => {
      sinon.stub(convertService, 'docxToPdf').resolves(Buffer.from('pdf'));

      const req = {
        file: {
          originalname: 'report.doc',
          buffer: Buffer.from('doc'),
          mimetype: 'application/msword',
        },
      } as unknown as Request;
      const res = mockRes();

      await handleDocxToPdf(req, res, next);

      const headers = (res.set as sinon.SinonStub).firstCall.args[0];
      expect(headers['Content-Disposition']).to.equal('attachment; filename="report.pdf"');
    });

    it('should call next with error when service throws', async () => {
      const err = new UnsupportedMediaError('Wrong type');
      sinon.stub(convertService, 'docxToPdf').rejects(err);

      const req = {
        file: {
          originalname: 'file.docx',
          buffer: Buffer.from('data'),
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      } as unknown as Request;
      const res = mockRes();

      await handleDocxToPdf(req, res, next);

      expect(next.calledWith(err)).to.be.true;
    });
  });

  describe('handlePdfToDocx()', () => {
    it('should call next with ValidationError when no file is provided', async () => {
      const req = {} as Request;
      const res = mockRes();

      await handlePdfToDocx(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(ValidationError);
    });

    it('should return DOCX buffer with correct headers on success', async () => {
      const docxBuffer = Buffer.from('docx output');
      sinon.stub(convertService, 'pdfToDocx').resolves(docxBuffer);

      const req = {
        file: {
          originalname: 'report.pdf',
          buffer: Buffer.from('pdf input'),
          mimetype: 'application/pdf',
        },
      } as unknown as Request;
      const res = mockRes();

      await handlePdfToDocx(req, res, next);

      expect(next.called).to.be.false;
      const headers = (res.set as sinon.SinonStub).firstCall.args[0];
      expect(headers['Content-Type']).to.include('wordprocessingml');
      expect(headers['Content-Disposition']).to.equal('attachment; filename="report.docx"');
      expect((res.send as sinon.SinonStub).calledWith(docxBuffer)).to.be.true;
    });

    it('should call next with error when service throws', async () => {
      const err = new UnsupportedMediaError('Wrong type');
      sinon.stub(convertService, 'pdfToDocx').rejects(err);

      const req = {
        file: {
          originalname: 'file.pdf',
          buffer: Buffer.from('data'),
          mimetype: 'application/pdf',
        },
      } as unknown as Request;
      const res = mockRes();

      await handlePdfToDocx(req, res, next);

      expect(next.calledWith(err)).to.be.true;
    });
  });
});
