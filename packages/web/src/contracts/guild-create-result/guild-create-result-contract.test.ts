import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import { guildCreateResultContract } from './guild-create-result-contract';
import { GuildCreateResultStub } from './guild-create-result.stub';

describe('guildCreateResultContract', () => {
  describe('valid results', () => {
    it('VALID: {id} => parses successfully', () => {
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const result = guildCreateResultContract.parse(GuildCreateResultStub({ id: guildId }));

      expect(result).toStrictEqual({ id: guildId });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {id: "invalid-uuid"} => throws validation error', () => {
      expect(() => guildCreateResultContract.parse({ id: 'invalid-uuid' })).toThrow(
        /invalid_format/u,
      );
    });

    it('INVALID: {missing id} => throws validation error', () => {
      expect(() => guildCreateResultContract.parse({})).toThrow(/invalid_type/u);
    });
  });
});
