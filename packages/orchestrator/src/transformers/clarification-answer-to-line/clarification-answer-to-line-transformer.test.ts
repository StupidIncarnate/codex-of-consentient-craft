import { ClarificationAnswerStub } from '../../contracts/clarification-answer/clarification-answer.stub';
import { clarificationAnswerToLineTransformer } from './clarification-answer-to-line-transformer';

describe('clarificationAnswerToLineTransformer', () => {
  it("VALID: {header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma'} => joins labels then text", () => {
    const answer = ClarificationAnswerStub({
      header: 'Letters',
      labels: ['Alpha', 'Gamma'],
      text: 'prefer Gamma',
    });

    const result = clarificationAnswerToLineTransformer({ answer });

    expect(result).toBe('Letters: Alpha, Gamma — prefer Gamma');
  });

  it("VALID: {header: 'Size', labels: ['Small']} => returns header and the one label", () => {
    const answer = ClarificationAnswerStub({ header: 'Size', labels: ['Small'] });

    const result = clarificationAnswerToLineTransformer({ answer });

    expect(result).toBe('Size: Small');
  });

  it("VALID: {header: 'Letters', labels: ['Alpha', 'Gamma']} => joins labels with no text part", () => {
    const answer = ClarificationAnswerStub({ header: 'Letters', labels: ['Alpha', 'Gamma'] });

    const result = clarificationAnswerToLineTransformer({ answer });

    expect(result).toBe('Letters: Alpha, Gamma');
  });

  it("EMPTY: {header: 'Letters', labels: [], text: 'my own answer'} => returns the typed text alone", () => {
    const answer = ClarificationAnswerStub({
      header: 'Letters',
      labels: [],
      text: 'my own answer',
    });

    const result = clarificationAnswerToLineTransformer({ answer });

    expect(result).toBe('Letters: my own answer');
  });
});
