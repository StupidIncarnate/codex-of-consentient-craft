import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { stepTargetResolveBroker } from './step-target-resolve-broker';
import { stepTargetResolveBrokerProxy } from './step-target-resolve-broker.proxy';
import { StepCandidateStub } from '../../../contracts/step-candidate/step-candidate.stub';

describe('stepTargetResolveBroker', () => {
  describe('one match', () => {
    it('VALID: {one match} => returns success', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const session = proxy.sessionWithOneMatch();

      const result = await stepTargetResolveBroker({
        session,
        target: '[data-testid="subagent-chain-duration"]',
      });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('several matches', () => {
    it('INVALID: {two matches} => throws StepAmbiguousError carrying both candidates', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const candidates = [
        StepCandidateStub({
          index: 0,
          within: 'GUILD_LIST',
          text: '+',
          rect: '(444,348) 27x25',
        }),
        StepCandidateStub({
          index: 1,
          within: 'GUILD_SESSION_LIST',
          text: '+',
          rect: '(965,348) 27x25',
        }),
      ];
      const session = proxy.sessionWithCandidates({ candidates });

      const error = await stepTargetResolveBroker({
        session,
        target: '[data-testid="PIXEL_BTN"]',
      }).then(
        (): never => {
          throw new Error('Expected stepTargetResolveBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      const expectedMessage = [
        'AMBIGUOUS: 2 elements match target [data-testid="PIXEL_BTN"].',
        '  [0] within=GUILD_LIST text="+" rect=(444,348) 27x25',
        '  [1] within=GUILD_SESSION_LIST text="+" rect=(965,348) 27x25',
        'Pick one by narrowing with `within`.',
      ].join('\n');

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepAmbiguousError',
        message: expectedMessage,
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

  describe('within narrows an ambiguous target to one', () => {
    it('VALID: {within narrows two matches to one} => returns success', async () => {
      const proxy = stepTargetResolveBrokerProxy();
      const unscopedCandidates = [
        StepCandidateStub({
          index: 0,
          within: 'GUILD_LIST',
          text: '+',
          rect: '(444,348) 27x25',
        }),
        StepCandidateStub({
          index: 1,
          within: 'GUILD_SESSION_LIST',
          text: '+',
          rect: '(965,348) 27x25',
        }),
      ];
      const session = proxy.sessionNarrowingWithin({ unscopedCandidates });

      const unscopedError = await stepTargetResolveBroker({
        session,
        target: '[data-testid="PIXEL_BTN"]',
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
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
