import { inflateXmlStringsTransformer } from './inflate-xml-strings-transformer';

const stubParseXml = (params: { xml: string }): unknown => {
  const { xml } = params;
  if (xml.includes('<task-notification>')) {
    return {
      'task-notification': {
        'task-id': 't1',
        status: 'completed',
        total_tokens: '500',
      },
    };
  }
  if (xml.includes('<list>')) {
    return { list: { item: ['a', 'b'] } };
  }
  if (xml === '<a><b>1</b></a>') {
    return { a: { b: '1' } };
  }
  if (xml === '<a>1</a>') {
    return { a: '1' };
  }
  return {};
};

// Mirrors fast-xml-parser: it throws on a string the XML_PATTERN accepts but that is not
// well-formed, rather than returning a partial result.
const throwingParseXml = (): unknown => {
  throw new Error('readTagExp returned undefined at position 396');
};

const parseXmlThrowingOnBrokenOnly = ({ xml }: { xml: string }): unknown => {
  if (xml === '<a><b>1</b></a>') {
    return { a: { b: '1' } };
  }
  throw new Error('readTagExp returned undefined at position 12');
};

describe('inflateXmlStringsTransformer', () => {
  describe('XML string inflation', () => {
    it('VALID: {value: "<task-notification>...</task-notification>"} => returns parsed object with camelCased tag names', () => {
      expect(
        inflateXmlStringsTransformer({
          value:
            '<task-notification><task-id>t1</task-id><status>completed</status><total_tokens>500</total_tokens></task-notification>',
          parseXml: stubParseXml,
        }),
      ).toStrictEqual({
        taskNotification: {
          taskId: 't1',
          status: 'completed',
          totalTokens: '500',
        },
      });
    });

    it('VALID: nested object with XML string field => inflates the XML field in place', () => {
      expect(
        inflateXmlStringsTransformer({
          value: {
            type: 'user',
            message: {
              role: 'user',
              content: '<task-notification><task-id>t1</task-id></task-notification>',
            },
          },
          parseXml: stubParseXml,
        }),
      ).toStrictEqual({
        type: 'user',
        message: {
          role: 'user',
          content: {
            taskNotification: {
              taskId: 't1',
              status: 'completed',
              totalTokens: '500',
            },
          },
        },
      });
    });

    it('VALID: repeated XML tags => stub returns array under repeated tag', () => {
      expect(
        inflateXmlStringsTransformer({
          value: '<list><item>a</item><item>b</item></list>',
          parseXml: stubParseXml,
        }),
      ).toStrictEqual({ list: { item: ['a', 'b'] } });
    });
  });

  describe('non-XML strings are preserved', () => {
    it('VALID: {value: "plain text"} => returns plain text unchanged', () => {
      expect(
        inflateXmlStringsTransformer({
          value: 'plain text',
          parseXml: stubParseXml,
        }),
      ).toBe('plain text');
    });

    it('VALID: {value: "<tag without close"} => returns string unchanged', () => {
      expect(
        inflateXmlStringsTransformer({
          value: '<tag without close',
          parseXml: stubParseXml,
        }),
      ).toBe('<tag without close');
    });

    it('VALID: {value: "Hello <name> world"} => returns string unchanged (mixed text + tags)', () => {
      expect(
        inflateXmlStringsTransformer({
          value: 'Hello <name> world',
          parseXml: stubParseXml,
        }),
      ).toBe('Hello <name> world');
    });

    it('EMPTY: {value: ""} => returns empty string unchanged', () => {
      expect(
        inflateXmlStringsTransformer({
          value: '',
          parseXml: stubParseXml,
        }),
      ).toBe('');
    });

    it('VALID: parser returns empty object => returns string unchanged', () => {
      expect(
        inflateXmlStringsTransformer({
          value: '<a></a>',
          parseXml: () => ({}),
        }),
      ).toBe('<a></a>');
    });

    it('VALID: parser returns only #text key => returns string unchanged', () => {
      expect(
        inflateXmlStringsTransformer({
          value: '<a>x</a>',
          parseXml: () => ({ '#text': 'x' }),
        }),
      ).toBe('<a>x</a>');
    });

    it('VALID: parser returns non-object => returns string unchanged', () => {
      expect(
        inflateXmlStringsTransformer({
          value: '<a>1</a>',
          parseXml: () => 'not an object',
        }),
      ).toBe('<a>1</a>');
    });

    it('VALID: parser returns null => returns string unchanged', () => {
      expect(
        inflateXmlStringsTransformer({
          value: '<a>1</a>',
          parseXml: () => null,
        }),
      ).toBe('<a>1</a>');
    });
  });

  describe('malformed XML the pattern accepts', () => {
    it('ERROR: parser throws on a bare "<" in prose => returns the string unchanged instead of propagating', () => {
      // XML_PATTERN checks only that the string opens and closes with a tag. Prose wrapped in
      // tags carries characters fast-xml-parser rejects, and the only caller runs inside a
      // readline handler where a throw is an uncaught exception that kills the server process.
      expect(
        inflateXmlStringsTransformer({
          value: '<report>duration stayed "<1m", expanded content stayed present</report>',
          parseXml: throwingParseXml,
        }),
      ).toBe('<report>duration stayed "<1m", expanded content stayed present</report>');
    });

    it('ERROR: parser throws on an XML string at an object-property position => leaves the property a string', () => {
      expect(
        inflateXmlStringsTransformer({
          value: {
            type: 'assistant',
            message: { role: 'assistant', content: '<report>a < b</report>' },
          },
          parseXml: throwingParseXml,
        }),
      ).toStrictEqual({
        type: 'assistant',
        message: { role: 'assistant', content: '<report>a < b</report>' },
      });
    });

    it('ERROR: parser throws on one property while another parses => inflates only the parsable one', () => {
      expect(
        inflateXmlStringsTransformer({
          value: {
            broken: '<report>a < b</report>',
            fine: '<a><b>1</b></a>',
          },
          parseXml: parseXmlThrowingOnBrokenOnly,
        }),
      ).toStrictEqual({
        broken: '<report>a < b</report>',
        fine: { a: { b: '1' } },
      });
    });
  });

  describe('non-string primitives', () => {
    it('VALID: {value: 42} => returns 42', () => {
      expect(
        inflateXmlStringsTransformer({
          value: 42,
          parseXml: stubParseXml,
        }),
      ).toBe(42);
    });

    it('VALID: {value: true} => returns true', () => {
      expect(
        inflateXmlStringsTransformer({
          value: true,
          parseXml: stubParseXml,
        }),
      ).toBe(true);
    });

    it('EMPTY: {value: null} => returns null', () => {
      expect(
        inflateXmlStringsTransformer({
          value: null,
          parseXml: stubParseXml,
        }),
      ).toBe(null);
    });

    it('EMPTY: {value: undefined} => returns undefined', () => {
      expect(
        inflateXmlStringsTransformer({
          value: undefined,
          parseXml: stubParseXml,
        }),
      ).toBe(undefined);
    });
  });

  describe('arrays', () => {
    it('VALID: array containing XML string => leaves both elements as-is (inflation skipped inside arrays)', () => {
      // Strings inside arrays are NOT inflated. Claude CLI packs message.content as an
      // array of `{type, text|content}` items whose strings (e.g. <tool_use_error>) are
      // meant for verbatim display. Inflation happens only at object-property string
      // positions where <task-notification> lives.
      expect(
        inflateXmlStringsTransformer({
          value: ['plain', '<a><b>1</b></a>'],
          parseXml: stubParseXml,
        }),
      ).toStrictEqual(['plain', '<a><b>1</b></a>']);
    });

    it('VALID: object containing array containing object with XML string content => inflation skipped at the inner string', () => {
      // Mirrors the real Claude CLI tool_result shape:
      //   message.content[i] = { type: 'tool_result', content: '<tool_use_error>...</tool_use_error>' }
      // The inner content string must reach the renderer unchanged.
      expect(
        inflateXmlStringsTransformer({
          value: {
            message: {
              content: [
                {
                  type: 'tool_result',
                  content: '<tool_use_error>Unknown skill: x</tool_use_error>',
                  is_error: true,
                },
              ],
            },
          },
          parseXml: stubParseXml,
        }),
      ).toStrictEqual({
        message: {
          content: [
            {
              type: 'tool_result',
              content: '<tool_use_error>Unknown skill: x</tool_use_error>',
              is_error: true,
            },
          ],
        },
      });
    });

    it('EMPTY: [] => returns []', () => {
      expect(
        inflateXmlStringsTransformer({
          value: [],
          parseXml: stubParseXml,
        }),
      ).toStrictEqual([]);
    });
  });

  describe('empty objects', () => {
    it('EMPTY: {} => returns {}', () => {
      expect(
        inflateXmlStringsTransformer({
          value: {},
          parseXml: stubParseXml,
        }),
      ).toStrictEqual({});
    });
  });
});
