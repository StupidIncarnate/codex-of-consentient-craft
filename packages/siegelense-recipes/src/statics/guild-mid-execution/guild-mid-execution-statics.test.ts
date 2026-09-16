import { guildMidExecutionStatics } from './guild-mid-execution-statics';

describe('guildMidExecutionStatics', () => {
  describe('counts', () => {
    it('VALID: {} => three quests and five operations', () => {
      expect(guildMidExecutionStatics.counts).toStrictEqual({ quests: 3, operations: 5 });
    });
  });
});
