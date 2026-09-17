import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import type { StepAmbiguousError } from '../../../errors/step-ambiguous/step-ambiguous-error';
import { stepTargetResolveBroker } from './step-target-resolve-broker';
import { stepTargetResolveBrokerProxy } from './step-target-resolve-broker.proxy';
import { StepCandidateStub } from '../../../contracts/step-candidate/step-candidate.stub';

const AMBIGUOUS_ADVICE =
  'Pick one by ref — { "step": "click", "ref": N } — or narrow with `within`. Two candidates sharing a `within` can only be told apart by ref; run `look` for the current key.';

describe('stepTargetResolveBroker', () => {
  describe('one match', () => {
    it('VALID: {one match} => returns success', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const session = proxy.sessionWithOneMatch();

      const result = await stepTargetResolveBroker({
        session,
        target: '[data-testid="subagent-chain-duration"]',
        within: null,
        ref: null,
      });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('several matches', () => {
    it('INVALID: {two matches} => throws StepAmbiguousError carrying both candidates, each with the ref that picks it', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const candidates = [
        StepCandidateStub({
          index: 0,
          ref: 16,
          within: 'GUILD_LIST',
          text: '+',
          rect: '(444,348) 27x25',
        }),
        StepCandidateStub({
          index: 1,
          ref: 23,
          within: 'GUILD_SESSION_LIST',
          text: '+',
          rect: '(965,348) 27x25',
        }),
      ];
      const session = proxy.sessionWithCandidates({ candidates });

      const error = await stepTargetResolveBroker({
        session,
        target: '[data-testid="PIXEL_BTN"]',
        within: null,
        ref: null,
      }).then(
        (): never => {
          throw new Error('Expected stepTargetResolveBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      const expectedMessage = [
        'AMBIGUOUS: 2 elements match target [data-testid="PIXEL_BTN"].',
        '  [0] ref=16 within=GUILD_LIST text="+" rect=(444,348) 27x25',
        '  [1] ref=23 within=GUILD_SESSION_LIST text="+" rect=(965,348) 27x25',
        AMBIGUOUS_ADVICE,
      ].join('\n');

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepAmbiguousError',
        message: expectedMessage,
      });
    });

    it('INVALID: {two matches sharing a within} => the structured candidates carry refs, so a session parsing the JSON can act on the answer', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const candidates = [
        StepCandidateStub({
          index: 0,
          ref: 22,
          within: '[data-testid="MAP_FRAME"]',
          text: 'BROWSE',
          rect: '(742,433) 66x27',
        }),
        StepCandidateStub({
          index: 1,
          ref: 26,
          within: '[data-testid="MAP_FRAME"]',
          text: 'CREATE',
          rect: '(607,472) 66x27',
        }),
      ];
      const session = proxy.sessionWithCandidates({ candidates });

      const error = await stepTargetResolveBroker({
        session,
        target: '[data-testid="PIXEL_BTN"]',
        within: '[data-testid="MAP_FRAME"]',
        ref: null,
      }).then(
        (): never => {
          throw new Error('Expected stepTargetResolveBroker to reject');
        },
        (caught: unknown): StepAmbiguousError => caught as StepAmbiguousError,
      );

      expect({ name: error.name, candidates: error.candidates }).toStrictEqual({
        name: 'StepAmbiguousError',
        candidates: [
          {
            index: 0,
            ref: 22,
            within: '[data-testid="MAP_FRAME"]',
            text: 'BROWSE',
            rect: '(742,433) 66x27',
          },
          {
            index: 1,
            ref: 26,
            within: '[data-testid="MAP_FRAME"]',
            text: 'CREATE',
            rect: '(607,472) 66x27',
          },
        ],
      });
    });
  });

  describe('zero matches', () => {
    it('EMPTY: {zero matches} => throws StepNoMatchError naming the nearest testIds', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const nearest = [
        ContentTextStub({ value: 'GUILD_LIST' }),
        ContentTextStub({ value: 'GUILD_ITEM_f52cd' }),
        ContentTextStub({ value: 'PIXEL_BTN' }),
      ];
      const session = proxy.sessionWithNearest({ nearest });

      const error = await stepTargetResolveBroker({
        session,
        target: '[data-testid="GUILD_ADD"]',
        within: null,
        ref: null,
      }).then(
        (): never => {
          throw new Error('Expected stepTargetResolveBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepNoMatchError',
        message:
          'NO MATCH: 0 elements match target [data-testid="GUILD_ADD"]. Nearest names on this page: GUILD_LIST, GUILD_ITEM_f52cd, PIXEL_BTN.',
      });
    });
  });

  describe('zero matches, no near misses on the page', () => {
    it('EMPTY: {zero matches, nearest: []} => throws StepNoMatchError naming that none were found', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const session = proxy.sessionWithNearest({ nearest: [] });

      const error = await stepTargetResolveBroker({
        session,
        target: '[data-testid="GUILD_ADD"]',
        within: null,
        ref: null,
      }).then(
        (): never => {
          throw new Error('Expected stepTargetResolveBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepNoMatchError',
        message:
          'NO MATCH: 0 elements match target [data-testid="GUILD_ADD"]. Nearest names on this page: (none found on this page).',
      });
    });
  });

  describe('the near-miss lookup itself fails', () => {
    it('ERROR: {nearestNames rejects} => propagates the lookup failure, not a StepNoMatchError', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const lookupFailure = new Error('page closed');
      const session = proxy.sessionWithFailedLookup({ error: lookupFailure });

      const error = await stepTargetResolveBroker({
        session,
        target: '[data-testid="GUILD_ADD"]',
        within: null,
        ref: null,
      }).then(
        (): never => {
          throw new Error('Expected stepTargetResolveBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'Error',
        message: 'page closed',
      });
    });
  });

  describe('within narrows an ambiguous target to one', () => {
    it('VALID: {within narrows two matches to one} => returns success', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const unscopedCandidates = [
        StepCandidateStub({
          index: 0,
          ref: 16,
          within: 'GUILD_LIST',
          text: '+',
          rect: '(444,348) 27x25',
        }),
        StepCandidateStub({
          index: 1,
          ref: 23,
          within: 'GUILD_SESSION_LIST',
          text: '+',
          rect: '(965,348) 27x25',
        }),
      ];
      const session = proxy.sessionNarrowingWithin({ unscopedCandidates });

      const unscopedError = await stepTargetResolveBroker({
        session,
        target: '[data-testid="PIXEL_BTN"]',
        within: null,
        ref: null,
      }).then(
        (): never => {
          throw new Error('Expected stepTargetResolveBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: unscopedError.name }).toStrictEqual({ name: 'StepAmbiguousError' });

      const result = await stepTargetResolveBroker({
        session,
        target: '[data-testid="PIXEL_BTN"]',
        within: 'GUILD_LIST',
        ref: null,
      });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('the ref arm', () => {
    it('VALID: {a live ref} => returns success, and never asks about matches, because a ref binds to one element', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const session = proxy.sessionWithLiveRef();

      const result = await stepTargetResolveBroker({
        session,
        target: null,
        within: null,
        ref: 23,
      });

      expect(result).toStrictEqual({ success: true });
    });

    it('ERROR: {a ref whose element detached} => throws RefStaleError naming the detached boundary', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const session = proxy.sessionWithStaleRef({ boundary: 'detached' });

      const error = await stepTargetResolveBroker({
        session,
        target: null,
        within: null,
        ref: 23,
      }).then(
        (): never => {
          throw new Error('Expected stepTargetResolveBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RefStaleError',
        message:
          'STALE REF: ref 23 no longer reaches an element — boundary crossed: detached. A ref binds to an ELEMENT and never to a row number, so this is never a different element. Run `look` again for the current key.',
      });
    });

    it('ERROR: {a ref used after a navigation} => throws RefStaleError naming the navigation boundary, never resolving to a different element', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const session = proxy.sessionWithStaleRef({ boundary: 'navigation' });

      const error = await stepTargetResolveBroker({
        session,
        target: null,
        within: null,
        ref: 23,
      }).then(
        (): never => {
          throw new Error('Expected stepTargetResolveBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RefStaleError',
        message:
          'STALE REF: ref 23 no longer reaches an element — boundary crossed: navigation. A ref binds to an ELEMENT and never to a row number, so this is never a different element. Run `look` again for the current key.',
      });
    });

    it('ERROR: {a ref from another instance} => throws RefUnknownError naming the highest this instance minted', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const session = proxy.sessionWithUnknownRef({ highestMinted: 41 });

      const error = await stepTargetResolveBroker({
        session,
        target: null,
        within: null,
        ref: 99,
      }).then(
        (): never => {
          throw new Error('Expected stepTargetResolveBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RefUnknownError',
        message:
          'UNKNOWN REF: ref 99 was never minted by this instance, whose highest minted ref is 41. A ref is scoped to ONE instance and one page state, and cannot cross any of four boundaries: a minion to its parent, a parent to a fixer, a walk to its re-walk, or a happy phase to an adversarial one. Run `look` on THIS instance, or target by testId with a `within` scope, which means the same element in any instance.',
      });
    });
  });

  describe('neither handle', () => {
    it('INVALID: {no target and no ref} => throws naming the contract that refuses that combination', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const session = proxy.sessionWithOneMatch();

      const error = await stepTargetResolveBroker({
        session,
        target: null,
        within: null,
        ref: null,
      }).then(
        (): never => {
          throw new Error('Expected stepTargetResolveBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'Error',
        message:
          'step-target-resolve-broker: a driving step reached the door with neither a `target` nor a `ref`. `stepContract` refuses that combination, so this means a step was built without going through it.',
      });
    });
  });
});
