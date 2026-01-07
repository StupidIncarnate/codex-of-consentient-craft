import { taskIdContract } from './task-id-contract';
import { TaskIdStub } from './task-id.stub';

describe('taskIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = TaskIdStub({ value: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c' });

    expect(id).toBe('f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = TaskIdStub();

    expect(id).toBe('f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c');
  });

  it('INVALID_ID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return taskIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return taskIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
