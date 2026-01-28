import { frameToElementsTransformer } from './frame-to-elements-transformer';

describe('frameToElementsTransformer', () => {
  describe('selected menu items', () => {
    it('VALID: {line starting with >} => returns menuItem with selected true', () => {
      const frame = '> Option 1';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: 'Option 1',
          selected: true,
        },
      ]);
    });

    it('VALID: {line starting with cursor character} => returns menuItem with selected true', () => {
      const frame = '\u276f Option 1';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: 'Option 1',
          selected: true,
        },
      ]);
    });

    it('VALID: {> with extra spaces} => returns menuItem with content trimmed of leading marker', () => {
      const frame = '>   Spaced Option';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: 'Spaced Option',
          selected: true,
        },
      ]);
    });
  });

  describe('unselected menu items', () => {
    it('VALID: {line with leading spaces} => returns menuItem with selected false', () => {
      const frame = '  Option 2';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: 'Option 2',
          selected: false,
        },
      ]);
    });

    it('VALID: {line with multiple leading spaces} => returns menuItem with selected false', () => {
      const frame = '    Indented Option';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: 'Indented Option',
          selected: false,
        },
      ]);
    });
  });

  describe('input fields', () => {
    it('VALID: {line ending with colon} => returns input type', () => {
      const frame = 'Enter your name:';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'input',
          content: 'Enter your name:',
        },
      ]);
    });

    it('VALID: {line ending with question mark} => returns input type', () => {
      const frame = 'What is your name?';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'input',
          content: 'What is your name?',
        },
      ]);
    });

    it('VALID: {line starting with question mark} => returns input type', () => {
      const frame = '? Select an option';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'input',
          content: '? Select an option',
        },
      ]);
    });
  });

  describe('text elements', () => {
    it('VALID: {regular text line} => returns text type', () => {
      const frame = 'Some regular text';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'text',
          content: 'Some regular text',
        },
      ]);
    });

    it('VALID: {line with single leading space} => returns text type', () => {
      const frame = ' Single space';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'text',
          content: 'Single space',
        },
      ]);
    });
  });

  describe('multi-line frames', () => {
    it('VALID: {mixed content frame} => returns array of different element types', () => {
      const frame = '> Selected Option\n  Unselected Option\nPlain text';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: 'Selected Option',
          selected: true,
        },
        {
          type: 'menuItem',
          content: 'Unselected Option',
          selected: false,
        },
        {
          type: 'text',
          content: 'Plain text',
        },
      ]);
    });

    it('VALID: {frame with input prompt and menu} => returns input and menu items', () => {
      const frame = '? Choose an option:\n> First\n  Second';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'input',
          content: '? Choose an option:',
        },
        {
          type: 'menuItem',
          content: 'First',
          selected: true,
        },
        {
          type: 'menuItem',
          content: 'Second',
          selected: false,
        },
      ]);
    });
  });

  describe('empty and whitespace handling', () => {
    it('EMPTY: {empty string} => returns empty array', () => {
      const frame = '';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {only whitespace} => returns empty array', () => {
      const frame = '   \n  \n   ';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {frame with empty lines between content} => filters out empty lines', () => {
      const frame = '> Option 1\n\n  Option 2\n\nSome text';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: 'Option 1',
          selected: true,
        },
        {
          type: 'menuItem',
          content: 'Option 2',
          selected: false,
        },
        {
          type: 'text',
          content: 'Some text',
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {line with only >} => returns menuItem with empty content', () => {
      const frame = '>';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: '',
          selected: true,
        },
      ]);
    });

    it('EDGE: {line with > followed by newline} => returns menuItem with empty content', () => {
      const frame = '>\n';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: '',
          selected: true,
        },
      ]);
    });

    it('EDGE: {line with only cursor character} => returns menuItem with empty content', () => {
      const frame = '\u276f';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: '',
          selected: true,
        },
      ]);
    });

    it('EDGE: {colon with trailing spaces} => returns input type', () => {
      const frame = 'Enter value:   ';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'input',
          content: 'Enter value:',
        },
      ]);
    });

    it('EDGE: {question mark with trailing spaces} => returns input type', () => {
      const frame = 'Are you sure?  ';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'input',
          content: 'Are you sure?',
        },
      ]);
    });

    it('EDGE: {leading spaces before question mark} => returns menuItem due to indentation priority', () => {
      const frame = '   ? Indented question';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: '? Indented question',
          selected: false,
        },
      ]);
    });

    it('EDGE: {content with special characters} => returns text when no prompt pattern at end', () => {
      const frame = 'File: /path/to/file.txt (100%)';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'text',
          content: 'File: /path/to/file.txt (100%)',
        },
      ]);
    });

    it('EDGE: {very long line} => handles long content', () => {
      const longContent = 'A'.repeat(500);
      const frame = `> ${longContent}`;

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: longContent,
          selected: true,
        },
      ]);
    });

    it('EDGE: {tabs as leading whitespace} => treats tabs as spaces for menu detection', () => {
      const frame = '\t\tTabbed option';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: 'Tabbed option',
          selected: false,
        },
      ]);
    });

    it('EDGE: {exactly 2 spaces boundary} => returns menuItem with selected false', () => {
      const frame = '  Exactly two spaces';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: 'Exactly two spaces',
          selected: false,
        },
      ]);
    });

    it('EDGE: {colon in middle of line} => returns input type due to ending colon pattern', () => {
      const frame = 'Name: John Smith:';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'input',
          content: 'Name: John Smith:',
        },
      ]);
    });

    it('EDGE: {colon in middle but not at end} => returns text type', () => {
      const frame = 'Key: value here';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'text',
          content: 'Key: value here',
        },
      ]);
    });

    it('EDGE: {unicode content} => preserves unicode characters', () => {
      const frame = '> Option with emoji \u2764 and symbols';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: 'Option with emoji \u2764 and symbols',
          selected: true,
        },
      ]);
    });

    it('EDGE: {newline characters only} => returns empty array', () => {
      const frame = '\n\n\n';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {carriage return and newline} => splits on newline only, carriage return preserved', () => {
      const frame = '> Option 1\r\n  Option 2';

      const result = frameToElementsTransformer({ frame });

      expect(result).toStrictEqual([
        {
          type: 'menuItem',
          content: 'Option 1\r',
          selected: true,
        },
        {
          type: 'menuItem',
          content: 'Option 2',
          selected: false,
        },
      ]);
    });
  });
});
