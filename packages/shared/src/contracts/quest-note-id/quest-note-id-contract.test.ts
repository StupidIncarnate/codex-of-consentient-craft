import { questNoteIdContract } from './quest-note-id-contract';
import { QuestNoteIdStub } from './quest-note-id.stub';

describe('questNoteIdContract', () => {
  it('VALID: {value: "tooling-error-playwright-binary-missing"} => parses successfully', () => {
    const id = QuestNoteIdStub({ value: 'tooling-error-playwright-binary-missing' });

    expect(id).toBe('tooling-error-playwright-binary-missing');
  });

  it('VALID: {default value} => uses the authored default id', () => {
    const id = QuestNoteIdStub();

    expect(id).toBe('open-question-comment-anchor-scope');
  });

  it('EMPTY: {value: ""} => throws, so a note can never be appended without an upsert key', () => {
    expect(() => QuestNoteIdStub({ value: '' })).toThrow(
      /String must contain at least 1 character/u,
    );
  });

  it('INVALID: {value: 42} => throws', () => {
    expect(() => questNoteIdContract.parse(42)).toThrow(/Expected string/u);
  });
});
