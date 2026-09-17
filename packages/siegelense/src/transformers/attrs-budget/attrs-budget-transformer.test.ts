import { AttrPairStub } from '../../contracts/attr-pair/attr-pair.stub';
import { attrsBudgetTransformer } from './attrs-budget-transformer';

describe('attrsBudgetTransformer', () => {
  describe('the compact link form', () => {
    it("VALID: {href: '/queue'} => kept as '→ /queue'", () => {
      const result = attrsBudgetTransformer({
        attributes: [AttrPairStub({ name: 'href', value: '/queue' })],
      });

      expect(result).toStrictEqual({
        kept: [{ name: 'href', value: '→ /queue' }],
        dropped: 0,
      });
    });

    it("VALID: {href with target=_blank} => kept as '→ /docs ↗', and target itself is never emitted", () => {
      const result = attrsBudgetTransformer({
        attributes: [
          AttrPairStub({ name: 'href', value: '/docs' }),
          AttrPairStub({ name: 'target', value: '_blank' }),
        ],
      });

      expect(result).toStrictEqual({
        kept: [{ name: 'href', value: '→ /docs ↗' }],
        dropped: 0,
      });
    });

    it('VALID: {href with target=_self} => no new-tab glyph', () => {
      const result = attrsBudgetTransformer({
        attributes: [
          AttrPairStub({ name: 'href', value: '/queue' }),
          AttrPairStub({ name: 'target', value: '_self' }),
        ],
      });

      expect(result).toStrictEqual({
        kept: [{ name: 'href', value: '→ /queue' }],
        dropped: 0,
      });
    });
  });

  describe('the allow list', () => {
    it("VALID: {data-status: 'failed'} => kept whole, because the app's own state word is the answer", () => {
      const result = attrsBudgetTransformer({
        attributes: [AttrPairStub({ name: 'data-status', value: 'failed' })],
      });

      expect(result).toStrictEqual({
        kept: [{ name: 'data-status', value: 'failed' }],
        dropped: 0,
      });
    });

    it('VALID: {maxlength, pattern, required, type} => all four kept, because they are what the antagonist is attacking', () => {
      const result = attrsBudgetTransformer({
        attributes: [
          AttrPairStub({ name: 'maxlength', value: '40' }),
          AttrPairStub({ name: 'pattern', value: '[a-z]+' }),
          AttrPairStub({ name: 'required', value: '' }),
          AttrPairStub({ name: 'type', value: 'password' }),
        ],
      });

      expect(result).toStrictEqual({
        kept: [
          { name: 'maxlength', value: '40' },
          { name: 'pattern', value: '[a-z]+' },
          { name: 'required', value: '' },
          { name: 'type', value: 'password' },
        ],
        dropped: 0,
      });
    });

    it('VALID: {className present} => absent from kept, and never counted as a drop, because it was never a candidate', () => {
      const result = attrsBudgetTransformer({
        attributes: [
          AttrPairStub({ name: 'class', value: 'm-4081bf90 mantine-Button-root' }),
          AttrPairStub({ name: 'className', value: 'css-1x2y3z' }),
          AttrPairStub({ name: 'data-status', value: 'failed' }),
        ],
      });

      expect(result).toStrictEqual({
        kept: [{ name: 'data-status', value: 'failed' }],
        dropped: 0,
      });
    });

    it('VALID: {data-testid present} => absent from kept, because the element column already carries it', () => {
      const result = attrsBudgetTransformer({
        attributes: [
          AttrPairStub({ name: 'data-testid', value: 'PIXEL_BTN' }),
          AttrPairStub({ name: 'data-status', value: 'open' }),
        ],
      });

      expect(result).toStrictEqual({
        kept: [{ name: 'data-status', value: 'open' }],
        dropped: 0,
      });
    });

    it('VALID: {an attribute nobody allowed} => absent from kept', () => {
      const result = attrsBudgetTransformer({
        attributes: [AttrPairStub({ name: 'style', value: 'color: red' })],
      });

      expect(result).toStrictEqual({ kept: [], dropped: 0 });
    });
  });

  describe('the determinism guard', () => {
    it('VALID: {a data attr holding a uuid-shaped value} => dropped, asserted on the complete kept array so its absence is the assertion', () => {
      const result = attrsBudgetTransformer({
        attributes: [
          AttrPairStub({ name: 'data-instance', value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
          AttrPairStub({ name: 'data-status', value: 'failed' }),
        ],
      });

      expect(result).toStrictEqual({
        kept: [{ name: 'data-status', value: 'failed' }],
        dropped: 0,
      });
    });

    it('VALID: {a data attr holding a React useId value} => dropped', () => {
      const result = attrsBudgetTransformer({
        attributes: [
          AttrPairStub({ name: 'data-for', value: ':r3:' }),
          AttrPairStub({ name: 'data-state', value: 'open' }),
        ],
      });

      expect(result).toStrictEqual({
        kept: [{ name: 'data-state', value: 'open' }],
        dropped: 0,
      });
    });

    it('VALID: {a data attr holding a long hex run} => dropped', () => {
      const result = attrsBudgetTransformer({
        attributes: [AttrPairStub({ name: 'data-key', value: 'a1b2c3d4e5f6a7b8' })],
      });

      expect(result).toStrictEqual({ kept: [], dropped: 0 });
    });

    it('VALID: {a data attr holding a short readable slug} => kept, because it is the app speaking and not a mint', () => {
      const result = attrsBudgetTransformer({
        attributes: [AttrPairStub({ name: 'data-guild', value: 'guild-alpha' })],
      });

      expect(result).toStrictEqual({
        kept: [{ name: 'data-guild', value: 'guild-alpha' }],
        dropped: 0,
      });
    });
  });

  describe('the budget', () => {
    it('VALID: {six candidates, cap of four} => four kept and dropped: 2', () => {
      const result = attrsBudgetTransformer({
        attributes: [
          AttrPairStub({ name: 'data-a', value: 'one' }),
          AttrPairStub({ name: 'data-b', value: 'two' }),
          AttrPairStub({ name: 'data-c', value: 'three' }),
          AttrPairStub({ name: 'data-d', value: 'four' }),
          AttrPairStub({ name: 'data-e', value: 'five' }),
          AttrPairStub({ name: 'data-f', value: 'six' }),
        ],
      });

      expect(result).toStrictEqual({
        kept: [
          { name: 'data-a', value: 'one' },
          { name: 'data-b', value: 'two' },
          { name: 'data-c', value: 'three' },
          { name: 'data-d', value: 'four' },
        ],
        dropped: 2,
      });
    });

    it('VALID: {a value longer than the cap} => truncated with an ellipsis rather than cut silently', () => {
      const result = attrsBudgetTransformer({
        attributes: [
          AttrPairStub({
            name: 'title',
            value: 'the quick brown fox jumps over the lazy dog and keeps going',
          }),
        ],
      });

      expect(result).toStrictEqual({
        kept: [{ name: 'title', value: 'the quick brown fox jumps over the lazy …' }],
        dropped: 0,
      });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no attributes} => an empty column and nothing dropped', () => {
      const result = attrsBudgetTransformer({ attributes: [] });

      expect(result).toStrictEqual({ kept: [], dropped: 0 });
    });
  });
});
