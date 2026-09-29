import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { KeyListingStub } from '../../../contracts/key-listing/key-listing.stub';
import { KeyRowStub } from '../../../contracts/key-row/key-row.stub';
import { stepMissEvidenceBroker } from './step-miss-evidence-broker';
import { stepMissEvidenceBrokerProxy } from './step-miss-evidence-broker.proxy';

describe('stepMissEvidenceBroker', () => {
  describe('ranked names and the key', () => {
    it('VALID: {seven names, one close to the target} => the five most alike, a count of 2 more, and the rendered key', async () => {
      const proxy = stepMissEvidenceBrokerProxy();
      const session = proxy.sessionWith({
        names: [
          ContentTextStub({ value: 'APP_ROOT_BG' }),
          ContentTextStub({ value: 'PIXEL_BTN' }),
          ContentTextStub({ value: 'GUILD_LIST' }),
          ContentTextStub({ value: 'QUEST_QUEUE' }),
          ContentTextStub({ value: 'GUILD_ADD_BTN' }),
          ContentTextStub({ value: 'APP_MAP_CONTAINER' }),
          ContentTextStub({ value: 'PIXEL_SPRITE' }),
        ],
        listing: KeyListingStub({ rendered: 'key: 7 rows\nref  element' }),
      });

      const result = await stepMissEvidenceBroker({
        session,
        target: '[data-testid="GUILD_ADD"]',
      });

      expect(result).toStrictEqual({
        nearest: ['GUILD_ADD_BTN', 'GUILD_LIST', 'PIXEL_BTN', 'QUEST_QUEUE', 'APP_ROOT_BG'],
        more: 2,
        key: 'key: 7 rows\nref  element',
      });
    });

    it('VALID: {a close name only in the key rows} => ranks it too', async () => {
      const proxy = stepMissEvidenceBrokerProxy();
      const session = proxy.sessionWith({
        names: [ContentTextStub({ value: 'PIXEL_BTN' })],
        listing: KeyListingStub({
          rows: [
            KeyRowStub({ ref: 1, testId: 'PIXEL_BTN' }),
            KeyRowStub({ ref: 2, testId: null }),
            KeyRowStub({ ref: 3, testId: 'GUILD_ADD_BTN' }),
          ],
          rendered: 'key: 3 rows',
        }),
      });

      const result = await stepMissEvidenceBroker({
        session,
        target: '[data-testid="GUILD_ADD"]',
      });

      expect(result).toStrictEqual({
        nearest: ['GUILD_ADD_BTN', 'PIXEL_BTN'],
        more: 0,
        key: 'key: 3 rows',
      });
    });
  });

  describe('failed reads', () => {
    it('ERROR: {look rejects} => still ranks the names and reports key: null', async () => {
      const proxy = stepMissEvidenceBrokerProxy();
      const session = proxy.sessionWithFailedLook({
        names: [ContentTextStub({ value: 'GUILD_LIST' })],
        error: new Error('page closed'),
      });

      const result = await stepMissEvidenceBroker({
        session,
        target: '[data-testid="GUILD_ADD"]',
      });

      expect(result).toStrictEqual({ nearest: ['GUILD_LIST'], more: 0, key: null });
    });

    it('ERROR: {nearestNames rejects} => propagates the lookup failure', async () => {
      const proxy = stepMissEvidenceBrokerProxy();
      const session = proxy.sessionWithFailedNames({ error: new Error('evaluate failed') });

      await expect(
        stepMissEvidenceBroker({ session, target: '[data-testid="GUILD_ADD"]' }),
      ).rejects.toThrow(/^evaluate failed$/u);
    });
  });
});
