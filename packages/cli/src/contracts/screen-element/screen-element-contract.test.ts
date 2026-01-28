import { screenElementContract } from './screen-element-contract';
import { ScreenElementStub } from './screen-element.stub';

describe('screenElementContract', () => {
  describe('valid screen elements', () => {
    it('VALID: {type: text, content} => parses successfully', () => {
      const element = ScreenElementStub({
        type: 'text',
        content: 'Hello World',
      });

      const result = screenElementContract.parse(element);

      expect(result).toStrictEqual({
        type: 'text',
        content: 'Hello World',
      });
    });

    it('VALID: {type: input, content} => parses successfully', () => {
      const element = ScreenElementStub({
        type: 'input',
        content: 'Enter your name',
      });

      const result = screenElementContract.parse(element);

      expect(result).toStrictEqual({
        type: 'input',
        content: 'Enter your name',
      });
    });

    it('VALID: {type: menuItem, content} => parses successfully', () => {
      const element = ScreenElementStub({
        type: 'menuItem',
        content: 'Option 1',
      });

      const result = screenElementContract.parse(element);

      expect(result).toStrictEqual({
        type: 'menuItem',
        content: 'Option 1',
      });
    });

    it('VALID: {type, content, selected: true} => parses with selected', () => {
      const element = ScreenElementStub({
        type: 'menuItem',
        content: 'Selected Option',
        selected: true,
      });

      const result = screenElementContract.parse(element);

      expect(result).toStrictEqual({
        type: 'menuItem',
        content: 'Selected Option',
        selected: true,
      });
    });

    it('VALID: {type, content, selected: false} => parses with selected false', () => {
      const element = ScreenElementStub({
        type: 'menuItem',
        content: 'Unselected Option',
        selected: false,
      });

      const result = screenElementContract.parse(element);

      expect(result).toStrictEqual({
        type: 'menuItem',
        content: 'Unselected Option',
        selected: false,
      });
    });

    it('VALID: {stub with defaults} => parses with default values', () => {
      const element = ScreenElementStub();

      const result = screenElementContract.parse(element);

      expect(result).toStrictEqual({
        type: 'text',
        content: 'Default content',
      });
    });
  });

  describe('invalid screen elements', () => {
    it('INVALID_TYPE: {type: "invalid"} => throws validation error', () => {
      expect(() => {
        return screenElementContract.parse({
          type: 'invalid' as never,
          content: 'Some content',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_CONTENT: {content: 123} => throws validation error', () => {
      expect(() => {
        return screenElementContract.parse({
          type: 'text',
          content: 123 as never,
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_SELECTED: {selected: "yes"} => throws validation error', () => {
      expect(() => {
        return screenElementContract.parse({
          type: 'text',
          content: 'Some content',
          selected: 'yes' as never,
        });
      }).toThrow(/Expected boolean/u);
    });

    it('INVALID_MULTIPLE: {missing type and content} => throws validation error', () => {
      expect(() => {
        return screenElementContract.parse({});
      }).toThrow(/Required/u);
    });

    it('EMPTY: {type: ""} => throws validation error', () => {
      expect(() => {
        return screenElementContract.parse({
          type: '' as never,
          content: 'Some content',
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
