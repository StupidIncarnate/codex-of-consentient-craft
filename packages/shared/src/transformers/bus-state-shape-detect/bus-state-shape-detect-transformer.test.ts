import { busStateShapeDetectTransformer } from './bus-state-shape-detect-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('busStateShapeDetectTransformer', () => {
  describe('source has both on and emit keys', () => {
    it('VALID: {colon-form properties on exported const} => returns export name', () => {
      const result = busStateShapeDetectTransformer({
        source: ContentTextStub({
          value: 'export const myBus = { emit: () => {}, on: () => {} };',
        }),
      });

      expect(String(result)).toBe('myBus');
    });

    it('VALID: {method-shorthand form} => returns export name', () => {
      const result = busStateShapeDetectTransformer({
        source: ContentTextStub({
          value: 'export const otherBus = { emit() {}, on() {} };',
        }),
      });

      expect(String(result)).toBe('otherBus');
    });

    it('VALID: {arrow-fn property values across multiple lines} => returns export name', () => {
      const result = busStateShapeDetectTransformer({
        source: ContentTextStub({
          value:
            'export const orchestrationEventsState = {\n  emit: ({ type }) => {},\n  on: ({ type, handler }) => {},\n};',
        }),
      });

      expect(String(result)).toBe('orchestrationEventsState');
    });
  });

  describe('source missing one of the keys', () => {
    it('EMPTY: {only emit, no on} => returns null', () => {
      const result = busStateShapeDetectTransformer({
        source: ContentTextStub({
          value: 'export const partial = { emit: () => {} };',
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {only on, no emit} => returns null', () => {
      const result = busStateShapeDetectTransformer({
        source: ContentTextStub({
          value: 'export const partial = { on: () => {} };',
        }),
      });

      expect(result).toBe(null);
    });
  });

  describe('source without an exported const', () => {
    it('EMPTY: {no export const} => returns null', () => {
      const result = busStateShapeDetectTransformer({
        source: ContentTextStub({
          value: 'const local = { emit: () => {}, on: () => {} };',
        }),
      });

      expect(result).toBe(null);
    });
  });
});
