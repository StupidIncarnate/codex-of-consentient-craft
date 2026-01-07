import { observableIdContract } from './observable-id-contract';
import { ObservableIdStub } from './observable-id.stub';

describe('observableIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });

    expect(id).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = ObservableIdStub();

    expect(id).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
  });

  it('INVALID_ID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return observableIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return observableIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
