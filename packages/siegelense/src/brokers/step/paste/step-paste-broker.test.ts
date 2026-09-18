import { stepPasteBroker } from './step-paste-broker';
import { stepPasteBrokerProxy } from './step-paste-broker.proxy';

describe('stepPasteBroker', () => {
  describe('within given, explicit timeoutMs with text', () => {
    it('VALID: {target, within, value, timeoutMs} => drives session.pasteMatch with scoped arguments', async () => {
      const proxy = stepPasteBrokerProxy();
      const { session, getPasteMatchCalls } = proxy.session();

      const result = await stepPasteBroker({
        session,
        target: '[data-testid="INPUT"]',
        within: '[data-testid="MODAL"]',
        ref: null,
        filePath: null,
        value: 'Pasted text',
        timeoutMs: 5000,
      });

      expect(getPasteMatchCalls()).toStrictEqual([
        [
          {
            target: '[data-testid="INPUT"]',
            within: '[data-testid="MODAL"]',
            filePath: null,
            value: 'Pasted text',
            timeoutMs: 5000,
          },
        ],
      ]);
      expect(result).toBe(
        'pasted "Pasted text" into [data-testid="INPUT"] within [data-testid="MODAL"]',
      );
    });
  });

  describe('no within, no timeoutMs with text', () => {
    it('VALID: {target, within: null, value, timeoutMs: null} => drives session.pasteMatch with default ceiling', async () => {
      const proxy = stepPasteBrokerProxy();
      const { session, getPasteMatchCalls } = proxy.session();

      const result = await stepPasteBroker({
        session,
        target: '[data-testid="INPUT"]',
        within: null,
        ref: null,
        filePath: null,
        value: 'Pasted text',
        timeoutMs: null,
      });

      expect(getPasteMatchCalls()).toStrictEqual([
        [
          {
            target: '[data-testid="INPUT"]',
            filePath: null,
            value: 'Pasted text',
            timeoutMs: 30_000,
          },
        ],
      ]);
      expect(result).toBe('pasted "Pasted text" into [data-testid="INPUT"]');
    });
  });

  describe('target with filePath', () => {
    it('VALID: {target, filePath} => drives session.pasteMatch with filePath and returns file reading', async () => {
      const proxy = stepPasteBrokerProxy();
      const { session, getPasteMatchCalls } = proxy.session();

      const result = await stepPasteBroker({
        session,
        target: '[data-testid="DROPZONE"]',
        within: null,
        ref: null,
        filePath: '/tmp/upload.png',
        value: null,
        timeoutMs: 8000,
      });

      expect(getPasteMatchCalls()).toStrictEqual([
        [
          {
            target: '[data-testid="DROPZONE"]',
            filePath: '/tmp/upload.png',
            value: null,
            timeoutMs: 8000,
          },
        ],
      ]);
      expect(result).toBe('pasted file "/tmp/upload.png" into [data-testid="DROPZONE"]');
    });
  });

  describe('target within with filePath', () => {
    it('VALID: {target, within, filePath} => drives session.pasteMatch with scoped file reading', async () => {
      const proxy = stepPasteBrokerProxy();
      const { session, getPasteMatchCalls } = proxy.session();

      const result = await stepPasteBroker({
        session,
        target: '[data-testid="DROPZONE"]',
        within: '[data-testid="PANEL"]',
        ref: null,
        filePath: '/tmp/upload.png',
        value: null,
        timeoutMs: null,
      });

      expect(getPasteMatchCalls()).toStrictEqual([
        [
          {
            target: '[data-testid="DROPZONE"]',
            within: '[data-testid="PANEL"]',
            filePath: '/tmp/upload.png',
            value: null,
            timeoutMs: 30_000,
          },
        ],
      ]);
      expect(result).toBe(
        'pasted file "/tmp/upload.png" into [data-testid="DROPZONE"] within [data-testid="PANEL"]',
      );
    });
  });

  describe('driving by ref with text', () => {
    it('VALID: {ref, value} => drives session.pasteRef with that ref and default ceiling', async () => {
      const proxy = stepPasteBrokerProxy();
      const { session, getPasteRefCalls } = proxy.session();

      const result = await stepPasteBroker({
        session,
        target: null,
        within: null,
        ref: 14,
        filePath: null,
        value: 'ref-paste-val',
        timeoutMs: null,
      });

      expect(getPasteRefCalls()).toStrictEqual([
        [{ ref: 14, filePath: null, value: 'ref-paste-val', timeoutMs: 30_000 }],
      ]);
      expect(result).toBe('pasted "ref-paste-val" into ref 14');
    });

    it('VALID: {ref} => never touches selector path', async () => {
      const proxy = stepPasteBrokerProxy();
      const { session, getPasteMatchCalls } = proxy.session();

      await stepPasteBroker({
        session,
        target: null,
        within: null,
        ref: 14,
        filePath: null,
        value: 'ref-paste-val',
        timeoutMs: null,
      });

      expect(getPasteMatchCalls()).toStrictEqual([]);
    });
  });

  describe('driving by ref with filePath', () => {
    it('VALID: {ref, filePath} => drives session.pasteRef with that ref and filePath', async () => {
      const proxy = stepPasteBrokerProxy();
      const { session, getPasteRefCalls } = proxy.session();

      const result = await stepPasteBroker({
        session,
        target: null,
        within: null,
        ref: 22,
        filePath: '/tmp/clip.png',
        value: null,
        timeoutMs: 4000,
      });

      expect(getPasteRefCalls()).toStrictEqual([
        [{ ref: 22, filePath: '/tmp/clip.png', value: null, timeoutMs: 4000 }],
      ]);
      expect(result).toBe('pasted file "/tmp/clip.png" into ref 22');
    });
  });

  describe('neither handle', () => {
    it('INVALID: {no target and no ref} => throws naming the contract that refuses that combination', async () => {
      const proxy = stepPasteBrokerProxy();
      const { session } = proxy.session();

      const error = await stepPasteBroker({
        session,
        target: null,
        within: null,
        ref: null,
        filePath: null,
        value: 'x',
        timeoutMs: null,
      }).then(
        (): never => {
          throw new Error('Expected stepPasteBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(error.message).toBe(
        'step-paste-broker: a paste reached the driver with neither a `target` nor a `ref`. `stepContract` refuses that combination, so this means a step was built without going through it.',
      );
    });
  });
});
