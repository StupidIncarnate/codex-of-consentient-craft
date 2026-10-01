import { clarificationAnswerToLineTransformer } from './clarification-answer-to-line-transformer';

describe('clarificationAnswerToLineTransformer', () => {
  it("VALID: {header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma'} => joins labels then text", () => {
    const result = clarificationAnswerToLineTransformer({
      answer: { header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma' },
    });

    expect(result).toBe('Letters: Alpha, Gamma — prefer Gamma');
  });

  it("VALID: {header: 'Size', labels: ['Small']} => returns header and the one label", () => {
    const result = clarificationAnswerToLineTransformer({
      answer: { header: 'Size', labels: ['Small'] },
    });

    expect(result).toBe('Size: Small');
  });

  it("VALID: {header: 'Letters', labels: ['Alpha', 'Gamma']} => joins labels with no text part", () => {
    const result = clarificationAnswerToLineTransformer({
      answer: { header: 'Letters', labels: ['Alpha', 'Gamma'] },
    });

    expect(result).toBe('Letters: Alpha, Gamma');
  });

  it("EMPTY: {header: 'Letters', labels: [], text: 'my own answer'} => returns the typed text alone", () => {
    const result = clarificationAnswerToLineTransformer({
      answer: { header: 'Letters', labels: [], text: 'my own answer' },
    });

    expect(result).toBe('Letters: my own answer');
  });
});
