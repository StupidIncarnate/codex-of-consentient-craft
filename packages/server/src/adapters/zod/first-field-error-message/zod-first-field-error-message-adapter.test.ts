import { z } from 'zod';

import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { zodFirstFieldErrorMessageAdapter } from './zod-first-field-error-message-adapter';
import { zodFirstFieldErrorMessageAdapterProxy } from './zod-first-field-error-message-adapter.proxy';

type CapturedZodError = Parameters<typeof zodFirstFieldErrorMessageAdapter>[0]['error'];

describe('zodFirstFieldErrorMessageAdapter', () => {
  describe('the named field carries an issue', () => {
    it('VALID: {field: "images", an over-cap array} => returns that field\'s own message', () => {
      zodFirstFieldErrorMessageAdapterProxy();
      const schema = z.object({ images: z.array(z.string().brand<'Item'>()).max(1) });

      const parsed = schema.safeParse({ images: ['a', 'b'] }) as {
        success: false;
        error: CapturedZodError;
      };

      const message = zodFirstFieldErrorMessageAdapter({
        error: parsed.error,
        field: ContentTextStub({ value: 'images' }),
      });

      expect(message).toBe('Too big: expected array to have <=1 items');
    });
  });

  describe('a different field carries the issue', () => {
    it('EMPTY: {field: "images", only "message" fails} => returns undefined', () => {
      zodFirstFieldErrorMessageAdapterProxy();
      const schema = z.object({
        images: z.array(z.string().brand<'Item'>()).max(1),
        message: z.string().brand<'Message'>().min(1),
      });

      const parsed = schema.safeParse({ images: ['a'], message: '' }) as {
        success: false;
        error: CapturedZodError;
      };

      const message = zodFirstFieldErrorMessageAdapter({
        error: parsed.error,
        field: ContentTextStub({ value: 'images' }),
      });

      expect(message).toBe(undefined);
    });
  });
});
