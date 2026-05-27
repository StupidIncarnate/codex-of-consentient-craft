import { askUserQuestionResponseContract } from './ask-user-question-response-contract';
import { AskUserQuestionResponseStub } from './ask-user-question-response.stub';

describe('askUserQuestionResponseContract', () => {
  it('VALID: {stub default} => parses to questions + answers shape with single-select string answer', () => {
    const result = AskUserQuestionResponseStub();

    const { questions, answers } = result;
    const [firstQuestion] = questions;
    const answerValues = Object.values(answers);

    expect(firstQuestion?.question).toBe('Which option do you prefer?');
    expect(answerValues).toStrictEqual(['Option A']);
  });

  it('VALID: {stub override with multi-select array} => parses array of labels', () => {
    const result = AskUserQuestionResponseStub({
      questions: [
        {
          question: 'Pick several',
          header: 'Choice',
          options: [
            { label: 'A', description: 'Option A' },
            { label: 'B', description: 'Option B' },
          ],
          multiSelect: true,
        },
      ],
      answers: { 'Pick several': ['A', 'B'] },
    });

    const answerValues = Object.values(result.answers);

    expect(answerValues).toStrictEqual([['A', 'B']]);
  });

  it('INVALID: {missing answers} => throws Required error', () => {
    expect(() =>
      askUserQuestionResponseContract.parse({
        questions: [
          {
            question: 'Pick one',
            header: 'Choice',
            options: [{ label: 'A', description: 'Option A' }],
            multiSelect: false,
          },
        ],
      }),
    ).toThrow('Required');
  });
});
