import { questWorkItemIdContract } from './quest-work-item-id-contract';
import { QuestWorkItemIdStub } from './quest-work-item-id.stub';

describe('questWorkItemIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {default value} => uses default id', () => {
    const id = QuestWorkItemIdStub();

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {value: different uuid} => parses successfully', () => {
    const id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('INVALID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return questWorkItemIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return questWorkItemIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
