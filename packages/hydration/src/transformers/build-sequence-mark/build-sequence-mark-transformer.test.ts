import { buildSequenceMarkTransformer } from './build-sequence-mark-transformer';

describe('buildSequenceMarkTransformer', () => {
  it('VALID: {advance: false} => repeated peeks return the same value', () => {
    const first = buildSequenceMarkTransformer({ advance: false });
    const second = buildSequenceMarkTransformer({ advance: false });

    expect(second).toBe(first);
  });

  it('VALID: {advance: true} => returns one more than the immediately preceding peek', () => {
    const before = buildSequenceMarkTransformer({ advance: false });
    const after = buildSequenceMarkTransformer({ advance: true });

    expect(after).toBe(before + 1);
  });

  it('VALID: {advance: true, called twice} => the second call returns one more than the first', () => {
    const first = buildSequenceMarkTransformer({ advance: true });
    const second = buildSequenceMarkTransformer({ advance: true });

    expect(second).toBe(first + 1);
  });

  it('VALID: {advance: true, then advance: false} => the peek reads back the advanced value', () => {
    const advanced = buildSequenceMarkTransformer({ advance: true });
    const peeked = buildSequenceMarkTransformer({ advance: false });

    expect(peeked).toBe(advanced);
  });
});
