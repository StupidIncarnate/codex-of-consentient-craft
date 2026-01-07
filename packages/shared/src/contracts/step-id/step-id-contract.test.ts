import { stepIdContract } from './step-id-contract';
import { StepIdStub } from './step-id.stub';

describe('stepIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });

    expect(id).toBe('e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = StepIdStub();

    expect(id).toBe('e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b');
  });

  it('INVALID_ID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return stepIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return stepIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
