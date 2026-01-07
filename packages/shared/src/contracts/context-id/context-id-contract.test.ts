import { contextIdContract } from './context-id-contract';
import { ContextIdStub } from './context-id.stub';

describe('contextIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = ContextIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = ContextIdStub();

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID_ID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return contextIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return contextIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
