import { flowIdContract } from './flow-id-contract';
import { FlowIdStub } from './flow-id.stub';

describe('flowIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = FlowIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = FlowIdStub();

    expect(id).toBe('c23bd10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID_ID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return flowIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return flowIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
