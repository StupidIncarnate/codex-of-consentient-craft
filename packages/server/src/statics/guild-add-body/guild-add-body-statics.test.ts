import { guildAddBodyStatics } from './guild-add-body-statics';

describe('guildAddBodyStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(guildAddBodyStatics).toStrictEqual({
      limits: {
        nameMaxLength: 100,
      },
    });
  });
});
