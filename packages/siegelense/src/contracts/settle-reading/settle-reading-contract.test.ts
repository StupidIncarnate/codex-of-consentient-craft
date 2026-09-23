import { settleReadingContract } from './settle-reading-contract';
import { SettleReadingStub } from './settle-reading.stub';

describe('settleReadingContract', () => {
  describe('valid readings', () => {
    it('VALID: {a reading built by hand} => parses to exactly the fields the detector reports', () => {
      const result = settleReadingContract.parse({
        settled: false,
        reason: 'ceiling',
        waitedMs: 5000,
        unsettled: ['network'],
        pendingRequests: 1,
        pollersDiscounted: ['GET http://localhost:3737/api/quests'],
      });

      expect(result).toStrictEqual({
        settled: false,
        reason: 'ceiling',
        waitedMs: 5000,
        unsettled: ['network'],
        pendingRequests: 1,
        pollersDiscounted: ['GET http://localhost:3737/api/quests'],
      });
    });

    it('VALID: {} => parses the settled default', () => {
      const reading = SettleReadingStub();

      expect(reading).toStrictEqual({
        settled: true,
        reason: 'quiet',
        waitedMs: 0,
        unsettled: [],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });

    it('VALID: {a ceiling reading} => parses the unsettled signals and discounted pollers', () => {
      const reading = SettleReadingStub({
        settled: false,
        reason: 'ceiling',
        waitedMs: 5000,
        unsettled: ['network', 'dom'],
        pendingRequests: 2,
        pollersDiscounted: ['GET http://localhost:3737/api/quests'],
      });

      expect(reading).toStrictEqual({
        settled: false,
        reason: 'ceiling',
        waitedMs: 5000,
        unsettled: ['network', 'dom'],
        pendingRequests: 2,
        pollersDiscounted: ['GET http://localhost:3737/api/quests'],
      });
    });

    it('VALID: {unsettled: ["animation"]} => parses the animation signal', () => {
      const reading = SettleReadingStub({
        settled: false,
        reason: 'ceiling',
        waitedMs: 1200,
        unsettled: ['animation'],
      });

      expect(reading).toStrictEqual({
        settled: false,
        reason: 'ceiling',
        waitedMs: 1200,
        unsettled: ['animation'],
        pendingRequests: 0,
        pollersDiscounted: [],
      });
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {reason: "gave-up"} => throws naming the accepted reasons', () => {
      expect(() => SettleReadingStub({ reason: 'gave-up' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {unsettled: ["paint"]} => throws naming the accepted signals', () => {
      expect(() => SettleReadingStub({ unsettled: ['paint'] as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {waitedMs: -1} => throws on a negative wait', () => {
      expect(() => SettleReadingStub({ waitedMs: -1 as never })).toThrow(
        /greater than or equal to 0/u,
      );
    });

    it('INVALID: {an unknown key} => throws on the unrecognized key', () => {
      expect(() => SettleReadingStub({ pollCount: 4 } as never)).toThrow(/Unrecognized key/u);
    });
  });
});
