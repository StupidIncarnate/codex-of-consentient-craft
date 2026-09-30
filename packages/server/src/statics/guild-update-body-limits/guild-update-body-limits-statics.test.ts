import { guildUpdateBodyLimitsStatics } from './guild-update-body-limits-statics';

describe('guildUpdateBodyLimitsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(guildUpdateBodyLimitsStatics).toStrictEqual({
      maxNameLength: 100,
    });
  });
});
