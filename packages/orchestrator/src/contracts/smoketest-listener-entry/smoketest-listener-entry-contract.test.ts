import { smoketestListenerEntryContract } from './smoketest-listener-entry-contract';
import { SmoketestListenerEntryStub } from './smoketest-listener-entry.stub';

describe('smoketestListenerEntryContract', () => {
  it('VALID: {default stub} => parses with empty assertions and isOrchestration false', () => {
    expect(SmoketestListenerEntryStub()).toStrictEqual({
      assertions: [],
      isOrchestration: false,
    });
  });

  it('VALID: {isOrchestration true with postTeardownChecks omitted} => parses', () => {
    expect(SmoketestListenerEntryStub({ isOrchestration: true })).toStrictEqual({
      assertions: [],
      isOrchestration: true,
    });
  });

  it('INVALID: {isOrchestration missing} => throws', () => {
    expect(() => smoketestListenerEntryContract.parse({ assertions: [] })).toThrow(/boolean/u);
  });
});
