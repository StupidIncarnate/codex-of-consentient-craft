import { UntilCeilingHitError } from './until-ceiling-hit-error';

describe('UntilCeilingHitError', () => {
  describe('constructor()', () => {
    it('VALID: {descriptor: "visible [data-testid=...]", bufferNote: null} => the spec\'s own exact wording, nothing appended', () => {
      const error = new UntilCeilingHitError({
        descriptor: 'visible [data-testid="SUBAGENT_CHAIN"]',
        timeoutMs: 20000,
        bufferNote: null,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'UntilCeilingHitError',
        message: 'visible [data-testid="SUBAGENT_CHAIN"] never resolved in 20000ms',
      });
    });

    it('VALID: {descriptor: "file guilds/g1/quest.json", bufferNote: null} => names the form and the ceiling', () => {
      const error = new UntilCeilingHitError({
        descriptor: 'file guilds/g1/quest.json',
        timeoutMs: 10000,
        bufferNote: null,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'UntilCeilingHitError',
        message: 'file guilds/g1/quest.json never resolved in 10000ms',
      });
    });

    it('VALID: {descriptor, bufferNote: no earlier match} => appends the buffer note with no earlier-match sentence', () => {
      const error = new UntilCeilingHitError({
        descriptor: 'response POST /api/quests',
        timeoutMs: 15000,
        bufferNote: '0 of 12 network lines since this step began matched.',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'UntilCeilingHitError',
        message:
          'response POST /api/quests never resolved in 15000ms — 0 of 12 network lines since this step began matched.',
      });
    });

    it('VALID: {descriptor, bufferNote: an earlier match exists} => appends the full buffer note, naming how far back', () => {
      const error = new UntilCeilingHitError({
        descriptor: 'response POST /api/quests',
        timeoutMs: 15000,
        bufferNote:
          "0 of 12 network lines since this step began matched. A match DID arrive earlier in this instance's buffer, 3 lines before this step started: put the `until` before the step that triggers it, or read it back with `results --kind network`.",
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'UntilCeilingHitError',
        message:
          "response POST /api/quests never resolved in 15000ms — 0 of 12 network lines since this step began matched. A match DID arrive earlier in this instance's buffer, 3 lines before this step started: put the `until` before the step that triggers it, or read it back with `results --kind network`.",
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof UntilCeilingHitError => returns true', () => {
      const error = new UntilCeilingHitError({
        descriptor: 'predicate false',
        timeoutMs: 5000,
        bufferNote: null,
      });

      expect(error instanceof UntilCeilingHitError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new UntilCeilingHitError({
        descriptor: 'predicate false',
        timeoutMs: 5000,
        bufferNote: null,
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
