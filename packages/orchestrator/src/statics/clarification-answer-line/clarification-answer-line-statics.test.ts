import { clarificationAnswerLineStatics } from './clarification-answer-line-statics';

describe('clarificationAnswerLineStatics', () => {
  it('VALID: {separators} => carries the header, label and text separators', () => {
    expect(clarificationAnswerLineStatics).toStrictEqual({
      separators: {
        header: ': ',
        labels: ', ',
        text: ' — ',
      },
    });
  });
});
