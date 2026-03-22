import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import { errorHandler } from '../../src/middleware/error-handler';
import { AppError, ValidationError } from '../../src/utils/errors';

function mockReqRes() {
  const req = { url: '/test', method: 'POST' } as Request;
  const res: Partial<Response> = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return { req, res: res as Response };
}

describe('ErrorHandler middleware', () => {
  afterEach(() => sinon.restore());

  it('should respond with AppError statusCode and message', () => {
    const { req, res } = mockReqRes();
    const err = new AppError('Something went wrong', 422);

    errorHandler(err, req, res, sinon.stub() as any);

    expect((res.status as sinon.SinonStub).calledWith(422)).to.be.true;
    expect((res.json as sinon.SinonStub).calledOnce).to.be.true;

    const body = (res.json as sinon.SinonStub).firstCall.args[0];
    expect(body.status).to.equal('error');
    expect(body.message).to.equal('Something went wrong');
  });

  it('should respond 400 for ValidationError', () => {
    const { req, res } = mockReqRes();
    const err = new ValidationError('Invalid input');

    errorHandler(err, req, res, sinon.stub() as any);

    expect((res.status as sinon.SinonStub).calledWith(400)).to.be.true;
    const body = (res.json as sinon.SinonStub).firstCall.args[0];
    expect(body.message).to.equal('Invalid input');
  });

  it('should respond 500 for unexpected errors', () => {
    const { req, res } = mockReqRes();
    const err = new Error('Unexpected crash');

    errorHandler(err, req, res, sinon.stub() as any);

    expect((res.status as sinon.SinonStub).calledWith(500)).to.be.true;
    const body = (res.json as sinon.SinonStub).firstCall.args[0];
    expect(body.status).to.equal('error');
  });

  it('should hide error details in production', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { req, res } = mockReqRes();
    errorHandler(new Error('Secret crash'), req, res, sinon.stub() as any);

    const body = (res.json as sinon.SinonStub).firstCall.args[0];
    expect(body.message).to.equal('Internal server error');

    process.env.NODE_ENV = original;
  });
});
