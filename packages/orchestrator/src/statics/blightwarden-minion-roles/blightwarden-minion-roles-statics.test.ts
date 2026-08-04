import { blightwardenMinionRolesStatics } from './blightwarden-minion-roles-statics';

describe('blightwardenMinionRolesStatics', () => {
  it('VALID: exports the two minion roles in dispatch order', () => {
    expect(blightwardenMinionRolesStatics).toStrictEqual({
      roles: ['blightwarden-minion', 'blightwarden-crosscut-minion'],
    });
  });
});
