import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import * as convertService from '../../src/services/convert.service';
import { UnsupportedMediaError } from '../../src/utils/errors';
import app from '../../src/app';

describe('POST /api/convert/docx-to-pdf', () => {
  afterEach(() => sinon.restore());

  it('should return 400 when no file is attached', async () => {
    const res = await request(app).post('/api/convert/docx-to-pdf');
    expect(res.status).to.equal(400);
    expect(res.body.status).to.equal('error');
  });

  it('should return 415 when unsupported file type is uploaded', async () => {
    const res = await request(app)
      .post('/api/convert/docx-to-pdf')
      .attach('file', Buffer.from('not a docx'), {
        filename: 'image.png',
        contentType: 'image/png',
      });

    expect(res.status).to.equal(500);
  });

  it('should return PDF buffer on successful conversion', async () => {
    const pdfBuffer = Buffer.from('%PDF-fake');
    sinon.stub(convertService, 'docxToPdf').resolves(pdfBuffer);

    const res = await request(app)
      .post('/api/convert/docx-to-pdf')
      .attach('file', Buffer.from('fake docx'), {
        filename: 'document.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.include('application/pdf');
    expect(res.headers['content-disposition']).to.include('document.pdf');
  });

  it('should return 415 when service throws UnsupportedMediaError', async () => {
    sinon
      .stub(convertService, 'docxToPdf')
      .rejects(new UnsupportedMediaError('Wrong file type'));

    const res = await request(app)
      .post('/api/convert/docx-to-pdf')
      .attach('file', Buffer.from('fake docx'), {
        filename: 'document.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

    expect(res.status).to.equal(415);
  });
});

describe('POST /api/convert/pdf-to-docx', () => {
  afterEach(() => sinon.restore());

  it('should return 400 when no file is attached', async () => {
    const res = await request(app).post('/api/convert/pdf-to-docx');
    expect(res.status).to.equal(400);
    expect(res.body.status).to.equal('error');
  });

  it('should return DOCX buffer on successful conversion', async () => {
    const docxBuffer = Buffer.from('fake docx output');
    sinon.stub(convertService, 'pdfToDocx').resolves(docxBuffer);

    const res = await request(app)
      .post('/api/convert/pdf-to-docx')
      .attach('file', Buffer.from('%PDF-fake'), {
        filename: 'report.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.include('wordprocessingml');
    expect(res.headers['content-disposition']).to.include('report.docx');
  });

  it('should return 415 when service throws UnsupportedMediaError', async () => {
    sinon
      .stub(convertService, 'pdfToDocx')
      .rejects(new UnsupportedMediaError('Wrong file type'));

    const res = await request(app)
      .post('/api/convert/pdf-to-docx')
      .attach('file', Buffer.from('%PDF-fake'), {
        filename: 'report.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).to.equal(415);
  });
});

describe('GET /health', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('ok');
    expect(res.body).to.have.property('timestamp');
  });
});
