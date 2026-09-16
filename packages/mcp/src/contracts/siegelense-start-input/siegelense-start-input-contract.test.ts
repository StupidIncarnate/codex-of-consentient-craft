import { siegelenseStartInputContract } from './siegelense-start-input-contract';
import { SiegelenseStartInputStub } from './siegelense-start-input.stub';

describe('siegelenseStartInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {specName} => parses with questId and guildId both absent', () => {
      expect(siegelenseStartInputContract.parse(SiegelenseStartInputStub())).toStrictEqual({
        specName: 'dungeonmaster-web',
      });
    });

    it('VALID: {specName, questId, guildId} => parses all three fields', () => {
      expect(
        siegelenseStartInputContract.parse(
          SiegelenseStartInputStub({
            questId: 'add-auth',
            guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          }),
        ),
      ).toStrictEqual({
        specName: 'dungeonmaster-web',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing specName} => throws validation error', () => {
      expect(() => siegelenseStartInputContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {specName: ""} => throws validation error', () => {
      expect(() => siegelenseStartInputContract.parse({ specName: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() =>
        siegelenseStartInputContract.parse({
          specName: 'dungeonmaster-web',
          questId: '',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {guildId: not-a-uuid} => throws validation error', () => {
      expect(() =>
        siegelenseStartInputContract.parse({
          specName: 'dungeonmaster-web',
          guildId: 'not-a-uuid',
        }),
      ).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {driverInstance} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        siegelenseStartInputContract.parse({
          specName: 'dungeonmaster-web',
          driverInstance: 'inst_7f3a9c21',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
