import { questCommentIdContract } from './quest-comment-id-contract';
import { QuestCommentIdStub } from './quest-comment-id.stub';

describe('questCommentIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = QuestCommentIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = QuestCommentIdStub();

    expect(id).toBe('c0e3e17a-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return questCommentIdContract.parse('not-a-uuid');
    }).toThrow(/invalid_string/u);
  });

  it('EMPTY: {value: ""} => throws validation error', () => {
    expect(() => {
      return questCommentIdContract.parse('');
    }).toThrow(/invalid_string/u);
  });
});
