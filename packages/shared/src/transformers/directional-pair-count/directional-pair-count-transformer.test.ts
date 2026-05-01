import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { directionalPairCountTransformer } from './directional-pair-count-transformer';

describe('directionalPairCountTransformer', () => {
  it('VALID: {duplicates of one pair} => one entry with count 2', () => {
    const result = directionalPairCountTransformer({
      pairs: [
        ContentTextStub({ value: 'orchestrator → web' }),
        ContentTextStub({ value: 'orchestrator → web' }),
      ],
    });

    expect(result).toStrictEqual([
      {
        pair: ContentTextStub({ value: 'orchestrator → web' }),
        count: ContentTextStub({ value: '2' }),
      },
    ]);
  });

  it('VALID: {two distinct pairs} => preserves first-seen order', () => {
    const result = directionalPairCountTransformer({
      pairs: [
        ContentTextStub({ value: 'b → c' }),
        ContentTextStub({ value: 'a → b' }),
        ContentTextStub({ value: 'b → c' }),
      ],
    });

    expect(result).toStrictEqual([
      { pair: ContentTextStub({ value: 'b → c' }), count: ContentTextStub({ value: '2' }) },
      { pair: ContentTextStub({ value: 'a → b' }), count: ContentTextStub({ value: '1' }) },
    ]);
  });

  it('EMPTY: {no pairs} => returns empty array', () => {
    const result = directionalPairCountTransformer({ pairs: [] });

    expect(result).toStrictEqual([]);
  });
});
