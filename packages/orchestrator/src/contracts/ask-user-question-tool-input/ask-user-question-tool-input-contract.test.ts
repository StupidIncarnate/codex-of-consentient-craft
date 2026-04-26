import { askUserQuestionToolInputContract } from './ask-user-question-tool-input-contract';
import { AskUserQuestionToolInputStub } from './ask-user-question-tool-input.stub';

describe('askUserQuestionToolInputContract', (): void => {
  it('VALID: {default stub} => parses with JSON-encoded questions string', (): void => {
    const r = AskUserQuestionToolInputStub();

    expect(r.questions).toBe(JSON.stringify([{ question: 'Pick one' }]));
  });

  it('VALID: {array questions} => parses with array preserved', (): void => {
    const r = askUserQuestionToolInputContract.parse({ questions: [{ question: 'q1' }] });

    expect(r.questions).toStrictEqual([{ question: 'q1' }]);
  });

  it('VALID: {empty object} => questions undefined', (): void => {
    const r = askUserQuestionToolInputContract.parse({});

    expect(r.questions).toBe(undefined);
  });

  it('VALID: {extra keys} => preserved via passthrough', (): void => {
    const r = askUserQuestionToolInputContract.parse({ foo: 'bar' });

    expect((r as { foo?: unknown }).foo).toBe('bar');
  });

  it('ERROR: {non-object} => throws', (): void => {
    expect((): unknown => askUserQuestionToolInputContract.parse(42)).toThrow(/Expected object/u);
  });
});
