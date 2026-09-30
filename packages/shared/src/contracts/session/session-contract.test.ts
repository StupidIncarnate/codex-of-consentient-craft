import { sessionContract } from './session-contract';
import { SessionStub } from './session.stub';

describe('sessionContract', () => {
  it('VALID: {default stub} => parses with the default id', () => {
    const value = SessionStub();

    expect(value.id).toBe('9c4d8f1c-3e38-48c9-bdec-22b61883b473');
  });

  it('INVALID: {id: ""} => is rejected', () => {
    const result = sessionContract.safeParse({ id: '' });

    expect(result.success).toBe(false);
  });
});
