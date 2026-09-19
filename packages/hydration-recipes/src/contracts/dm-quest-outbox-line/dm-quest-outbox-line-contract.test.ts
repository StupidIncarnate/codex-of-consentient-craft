import { dmQuestOutboxLineContract } from './dm-quest-outbox-line-contract';
import { DmQuestOutboxLineStub } from './dm-quest-outbox-line.stub';

describe('dmQuestOutboxLineContract', () => {
  describe('valid lines', () => {
    it('VALID: {questId, timestamp} => parses to exactly those two fields', () => {
      const result = dmQuestOutboxLineContract.parse({
        questId: 'add-auth',
        timestamp: '2024-01-15T10:00:00.000Z',
      });

      expect(result).toStrictEqual({ questId: 'add-auth', timestamp: '2024-01-15T10:00:00.000Z' });
    });

    it('VALID: {stub with questId override} => parses with the overridden questId', () => {
      const line = DmQuestOutboxLineStub({ questId: 'other-quest' });

      expect(line).toStrictEqual({ questId: 'other-quest', timestamp: '2024-01-15T10:00:00.000Z' });
    });
  });

  describe('invalid lines', () => {
    it('INVALID: {timestamp: "not-a-date"} => throws "Invalid datetime"', () => {
      expect(() =>
        dmQuestOutboxLineContract.parse({ questId: 'add-auth', timestamp: 'not-a-date' }),
      ).toThrow(/Invalid datetime/u);
    });
  });

  describe('empty lines', () => {
    it('EMPTY: {} => throws "Required" for questId', () => {
      expect(() => dmQuestOutboxLineContract.parse({})).toThrow(/Required/u);
    });
  });
});
