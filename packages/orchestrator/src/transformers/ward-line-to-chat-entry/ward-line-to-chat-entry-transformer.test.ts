import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { wardLineToChatEntryTransformer } from './ward-line-to-chat-entry-transformer';

const FIXED_UUID = 'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b';
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

describe('wardLineToChatEntryTransformer', () => {
  describe('ward output lines', () => {
    it('VALID: {line: a ward status line} => returns an assistant-text ChatEntry carrying it verbatim', () => {
      registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(FIXED_UUID);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);

      const result = wardLineToChatEntryTransformer({
        line: 'lint  @dungeonmaster/web  PASS  878 files, 878 discovered (31.6s)',
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'lint  @dungeonmaster/web  PASS  878 files, 878 discovered (31.6s)',
        uuid: FIXED_UUID,
        timestamp: FIXED_TIMESTAMP,
      });
    });

    it('EDGE: {line: ""} => still returns an entry, so a blank ward line is not silently dropped', () => {
      registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(FIXED_UUID);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);

      const result = wardLineToChatEntryTransformer({ line: '' });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: '',
        uuid: FIXED_UUID,
        timestamp: FIXED_TIMESTAMP,
      });
    });

    it('VALID: {line: ANSI-coloured ward output} => preserves the escape codes for the renderer', () => {
      registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(FIXED_UUID);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);

      const result = wardLineToChatEntryTransformer({ line: '[32mPASS[0m' });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: '[32mPASS[0m',
        uuid: FIXED_UUID,
        timestamp: FIXED_TIMESTAMP,
      });
    });
  });
});
