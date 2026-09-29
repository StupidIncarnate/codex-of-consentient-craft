import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import type { WaitForCeilingHitError } from '../../../errors/wait-for-ceiling-hit/wait-for-ceiling-hit-error';
import { StepCandidateStub } from '../../../contracts/step-candidate/step-candidate.stub';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { stepWaitForBroker } from './step-wait-for-broker';
import { stepWaitForBrokerProxy } from './step-wait-for-broker.proxy';

describe('stepWaitForBroker', () => {
  describe('the state resolves', () => {
    it('VALID: {target, within, state, timeoutMs} => drives session.waitForMatch and reports the resolved state', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session, getWaitForMatchCalls } = proxy.sessionResolving();

      const result = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: '[data-testid="GUILD_LIST"]',
        state: 'visible',
        timeoutMs: 5000,
      });

      expect(getWaitForMatchCalls()).toStrictEqual([
        [
          {
            target: '[data-testid="MODAL"]',
            within: '[data-testid="GUILD_LIST"]',
            state: 'visible',
            timeoutMs: 5000,
          },
        ],
      ]);
      expect(result).toBe('[data-testid="MODAL"] reached state "visible"');
    });

    it('VALID: {target, within: null, state, timeoutMs: null} => drives session.waitForMatch with the default ceiling and no within key', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session, getWaitForMatchCalls } = proxy.sessionResolving();

      const result = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'hidden',
        timeoutMs: null,
      });

      expect(getWaitForMatchCalls()).toStrictEqual([
        [{ target: '[data-testid="MODAL"]', state: 'hidden', timeoutMs: 30_000 }],
      ]);
      expect(result).toBe('[data-testid="MODAL"] reached state "hidden"');
    });
  });

  describe('waitForSettle wiring', () => {
    it('VALID: {target, state resolves, page settles promptly} => waits for settle with the settle statics after waitForMatch resolves', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session, getWaitForSettleCalls } = proxy.sessionResolving();

      const result = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'visible',
        timeoutMs: null,
      });

      expect(getWaitForSettleCalls()).toStrictEqual([
        [
          {
            quietWindowMs: driverStatics.settle.quietWindowMs,
            ceilingMs: driverStatics.settle.ceilingMs,
            pollMs: driverStatics.settle.pollMs,
          },
        ],
      ]);
      expect(result).toBe('[data-testid="MODAL"] reached state "visible"');
    });

    it('VALID: {target, state resolves, page never settles} => reports the ceiling reason and the still-moving signals instead of the plain resolved-state message', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session } = proxy.sessionResolvingNeverSettling();

      const result = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'visible',
        timeoutMs: null,
      });

      expect(result).toBe(
        '[data-testid="MODAL"] reached state "visible"; did not settle after 5000ms (still moving: network)',
      );
    });

    it('ERROR: {waitForMatch hits its ceiling} => never calls waitForSettle, since the throw pre-empts it', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session, getWaitForSettleCalls } = proxy.sessionHittingCeiling();

      await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'visible',
        timeoutMs: 5000,
      }).then(
        (): never => {
          throw new Error('Expected stepWaitForBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect(getWaitForSettleCalls()).toStrictEqual([]);
    });
  });

  describe('the ceiling carries the page at that moment', () => {
    it('ERROR: {ceiling hit, zero matches} => names the ranked near misses and keeps the page key on the error', async () => {
      const proxy = stepWaitForBrokerProxy();
      const session = proxy.sessionHittingCeilingOnPage({
        matchCount: 0,
        names: [
          ContentTextStub({ value: 'APP_MAP_CONTAINER' }),
          ContentTextStub({ value: 'ROPE' }),
          ContentTextStub({ value: 'PIXEL_SPRITE' }),
        ],
        rendered: ContentTextStub({ value: 'key: 3 rows' }),
      });

      const error = await stepWaitForBroker({
        session,
        target: '[data-testid="NOPE"]',
        within: null,
        state: 'visible',
        timeoutMs: 2000,
      }).then(
        (): never => {
          throw new Error('Expected stepWaitForBroker to reject');
        },
        (caught: unknown): WaitForCeilingHitError => caught as WaitForCeilingHitError,
      );

      expect({ name: error.name, message: error.message, key: error.key }).toStrictEqual({
        name: 'WaitForCeilingHitError',
        message:
          'visible [data-testid="NOPE"] never resolved in 2000ms: Error: Timeout 2000ms exceeded — 0 elements match [data-testid="NOPE"] now. Nearest names on this page: ROPE, PIXEL_SPRITE, APP_MAP_CONTAINER.',
        key: 'key: 3 rows',
      });
    });

    it('ERROR: {ceiling hit, the element exists in another state} => names no near misses, still keeps the key', async () => {
      const proxy = stepWaitForBrokerProxy();
      const session = proxy.sessionHittingCeilingOnPage({
        matchCount: 1,
        names: [ContentTextStub({ value: 'MODAL' })],
        rendered: ContentTextStub({ value: 'key: 1 rows' }),
      });

      const error = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'hidden',
        timeoutMs: 2000,
      }).then(
        (): never => {
          throw new Error('Expected stepWaitForBroker to reject');
        },
        (caught: unknown): WaitForCeilingHitError => caught as WaitForCeilingHitError,
      );

      expect({ name: error.name, message: error.message, key: error.key }).toStrictEqual({
        name: 'WaitForCeilingHitError',
        message:
          'hidden [data-testid="MODAL"] never resolved in 2000ms: Error: Timeout 2000ms exceeded',
        key: 'key: 1 rows',
      });
    });
  });

  describe('the target matches twice', () => {
    it('INVALID: {strict-mode violation} => throws StepAmbiguousError listing the candidates, not a ceiling hit, and never settles', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session, getDescribeMatchesCalls, getWaitForSettleCalls } =
        proxy.sessionMatchingTwice({
          candidates: [
            StepCandidateStub({ index: 0, ref: 16, text: 'Open' }),
            StepCandidateStub({ index: 1, ref: 17, text: 'Open' }),
          ],
        });

      const error = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: '[data-testid="GUILD_LIST"]',
        state: 'visible',
        timeoutMs: 2000,
      }).then(
        (): never => {
          throw new Error('Expected stepWaitForBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepAmbiguousError',
        message:
          'AMBIGUOUS: 2 elements match target [data-testid="MODAL"] within=[data-testid="GUILD_LIST"].\n' +
          '  [0] ref=16 within=[data-testid="GUILD_LIST"] text="Open" rect=(444,348) 27x25\n' +
          '  [1] ref=17 within=[data-testid="GUILD_LIST"] text="Open" rect=(444,348) 27x25\n' +
          'Pick one by ref — { "step": "click", "ref": N } — or narrow with `within`. Two candidates sharing a `within` can only be told apart by ref; run `look` for the current key.',
      });
      expect(getDescribeMatchesCalls()).toStrictEqual([
        [{ target: '[data-testid="MODAL"]', within: '[data-testid="GUILD_LIST"]' }],
      ]);
      expect(getWaitForSettleCalls()).toStrictEqual([]);
    });
  });

  describe('the ceiling is hit', () => {
    it('ERROR: {target, timeoutMs} => throws WaitForCeilingHitError naming the state, the target and the ceiling', async () => {
      const proxy = stepWaitForBrokerProxy();
      const { session } = proxy.sessionHittingCeiling();

      const error = await stepWaitForBroker({
        session,
        target: '[data-testid="MODAL"]',
        within: null,
        state: 'visible',
        timeoutMs: 5000,
      }).then(
        (): never => {
          throw new Error('Expected stepWaitForBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'WaitForCeilingHitError',
        message:
          'visible [data-testid="MODAL"] never resolved in 5000ms: Error: Timeout 30000ms exceeded — 0 elements match [data-testid="MODAL"] now. Nearest names on this page: (none found on this page).',
      });
    });
  });
});
