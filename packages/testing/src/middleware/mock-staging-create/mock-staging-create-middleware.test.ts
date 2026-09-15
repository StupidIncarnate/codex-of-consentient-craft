import { mockStagingCreateMiddleware } from './mock-staging-create-middleware';
import { mockStagingCreateMiddlewareProxy } from './mock-staging-create-middleware.proxy';
import { StagedCallStub } from '../../contracts/staged-call/staged-call.stub';

describe('mockStagingCreateMiddleware', () => {
  it('VALID: {rejects: a same-realm Error} => record.impl rejects with that same error instance', async () => {
    mockStagingCreateMiddlewareProxy();
    const record = StagedCallStub();
    const staging = mockStagingCreateMiddleware({ record });
    const sameRealmError = new Error('boom');

    staging.rejects(sameRealmError);

    await expect(record.impl()).rejects.toBe(sameRealmError);
  });

  // DOMException decision (isNativeError:false, so a real DOMException reaches the transformer's
  // `instanceof Error` OR-branch) is asserted in mock-staging-create-transformer.test.ts via
  // DomExceptionStandIn, not with a live `DOMException` here: constructing one and letting Jest's
  // own matcher/printer touch it throws `TypeError: Value of "this" must be of DOMException` in
  // this repo's jest-environment-node sandbox. Node's newer web-standard globals (DOMException,
  // fetch, ...) bind to the process's original realm rather than jest's per-test vm context, so
  // `new DOMException(...) instanceof Error` is false even within the SAME test file — a
  // pre-existing environment quirk, independent of this fix, that makes a live DOMException
  // unusable as a value in a jest assertion here.
  it('VALID: {rejects: a plain string} => record.impl rejects with an Error carrying that text', async () => {
    mockStagingCreateMiddlewareProxy();
    const record = StagedCallStub();
    const staging = mockStagingCreateMiddleware({ record });

    staging.rejects('boom');

    await expect(record.impl()).rejects.toStrictEqual(new Error('boom'));
  });
});
