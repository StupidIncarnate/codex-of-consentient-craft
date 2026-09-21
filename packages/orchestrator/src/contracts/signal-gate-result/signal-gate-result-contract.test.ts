import { UnitIdStub } from '@dungeonmaster/shared/contracts';

import { signalGateResultContract } from './signal-gate-result-contract';
import { SignalGateResultStub } from './signal-gate-result.stub';

const REFUSAL_MESSAGE = [
  'REFUSED: 1 of your 2 assigned units are unmarked.',
  '',
  '  send-flow:observable:obs-3   scanning the text finds every absolute path',
  '',
  'Mark each one `met`, `cant-meet` or `unmet` through quest-work, then signal again.',
  '`unmet` is not failure and costs nothing — it mints your successor on exactly these.',
].join('\n');

describe('signalGateResultContract', () => {
  describe('the passing variant', () => {
    it('VALID: {ok: true} => parses carrying nothing else', () => {
      const result = signalGateResultContract.parse(SignalGateResultStub());

      expect(result).toStrictEqual({ ok: true });
    });

    it('EDGE: {ok: true, message} => strips the refusal-only key', () => {
      const result = signalGateResultContract.parse({
        ok: true,
        message: 'REFUSED: 1 of your 2 assigned units are unmarked.',
      });

      expect(result).toStrictEqual({ ok: true });
    });
  });

  describe('the refusal variant', () => {
    it('VALID: {ok: false, one unmarked id, message} => parses the whole refusal', () => {
      const result = signalGateResultContract.parse(
        SignalGateResultStub({
          ok: false,
          unmarked: [UnitIdStub({ value: 'send-flow:observable:obs-3' })],
          message: REFUSAL_MESSAGE,
        }),
      );

      expect(result).toStrictEqual({
        ok: false,
        unmarked: ['send-flow:observable:obs-3'],
        message: REFUSAL_MESSAGE,
      });
    });

    it('VALID: {ok: false, three unmarked ids} => parses every id in order', () => {
      const result = signalGateResultContract.parse({
        ok: false,
        unmarked: [
          'send-flow:observable:obs-3',
          'send-flow:observable:obs-7',
          'send-flow:branch:copy-ok',
        ],
        message: REFUSAL_MESSAGE,
      });

      expect(result).toStrictEqual({
        ok: false,
        unmarked: [
          'send-flow:observable:obs-3',
          'send-flow:observable:obs-7',
          'send-flow:branch:copy-ok',
        ],
        message: REFUSAL_MESSAGE,
      });
    });

    it('EMPTY: {ok: false, unmarked: []} => parses, because emptiness is the gate rule and not the shape', () => {
      const result = signalGateResultContract.parse({
        ok: false,
        unmarked: [],
        message: REFUSAL_MESSAGE,
      });

      expect(result).toStrictEqual({ ok: false, unmarked: [], message: REFUSAL_MESSAGE });
    });

    it('INVALID: {ok: false, message: ""} => throws min-length', () => {
      expect(() =>
        signalGateResultContract.parse({ ok: false, unmarked: [], message: '' }),
      ).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {ok: false, no message} => throws Required', () => {
      expect(() => signalGateResultContract.parse({ ok: false, unmarked: [] })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {ok: false, no unmarked} => throws Required', () => {
      expect(() => signalGateResultContract.parse({ ok: false, message: REFUSAL_MESSAGE })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {ok: false, unmarked: ["Send Flow:observable:obs-3"]} => throws on the id shape', () => {
      expect(() =>
        signalGateResultContract.parse({
          ok: false,
          unmarked: ['Send Flow:observable:obs-3'],
          message: REFUSAL_MESSAGE,
        }),
      ).toThrow(/Invalid/u);
    });
  });

  describe('the discriminator', () => {
    it('INVALID: {ok: "yes"} => throws discriminator error', () => {
      expect(() => signalGateResultContract.parse({ ok: 'yes' })).toThrow(
        /Invalid discriminator value/u,
      );
    });
  });
});
