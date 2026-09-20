import { FocusedElementStub } from '../../../contracts/focused-element/focused-element.stub';
import { keyPressLayerAdapter } from './key-press-layer-adapter';
import { keyPressLayerAdapterProxy } from './key-press-layer-adapter.proxy';

describe('keyPressLayerAdapter', () => {
  describe('focusReadSource()', () => {
    it('VALID: {focusReadSource} => generates page script inspecting activeElement', () => {
      keyPressLayerAdapterProxy();
      const adapter = keyPressLayerAdapter();
      const source = adapter.focusReadSource();

      const activeElementIndex = source.indexOf('document.activeElement');
      const siegeIndex = source.indexOf('__siege');
      const bodyIndex = source.indexOf('document.body');

      expect(activeElementIndex).toBeGreaterThan(-1);
      expect(siegeIndex).toBeGreaterThan(-1);
      expect(bodyIndex).toBeGreaterThan(-1);
    });
  });

  describe('toReading()', () => {
    it('VALID: {rawFocused: null} => returns reading with focused: null', () => {
      keyPressLayerAdapterProxy();
      const adapter = keyPressLayerAdapter();
      const result = adapter.toReading({ press: 'Enter', rawFocused: null });

      expect(result).toStrictEqual({
        press: 'Enter',
        focused: null,
      });
    });

    it('VALID: {rawFocused: element} => returns reading with focused element parsed', () => {
      keyPressLayerAdapterProxy();
      const adapter = keyPressLayerAdapter();
      const rawElement = FocusedElementStub({
        tag: 'input',
        testId: 'NAME_INPUT',
        text: 'alice',
        ref: 14,
      });
      const result = adapter.toReading({ press: 'Tab', rawFocused: rawElement });

      expect(result).toStrictEqual({
        press: 'Tab',
        focused: {
          tag: 'input',
          testId: 'NAME_INPUT',
          role: null,
          domId: null,
          text: 'alice',
          ref: 14,
        },
      });
    });

    it('INVALID: {invalid rawFocused shape} => throws parsing error', () => {
      keyPressLayerAdapterProxy();
      const adapter = keyPressLayerAdapter();

      expect(() => adapter.toReading({ press: 'Enter', rawFocused: 'not-an-element' })).toThrow(
        /Expected object/u,
      );
    });
  });
});
