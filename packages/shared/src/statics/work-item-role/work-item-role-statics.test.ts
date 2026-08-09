import { workItemRoleStatics } from './work-item-role-statics';

describe('workItemRoleStatics', () => {
  it('VALID: statics => matches the full expected object', () => {
    expect(workItemRoleStatics).toStrictEqual({
      names: [
        'chaoswhisperer',
        'glyphsmith',
        'bughunt',
        'tavernkeeper',
        'codeweaver',
        'ward',
        'spiritmender',
        'flowrider',
        'siegemaster',
        'blightwarden-group-minion',
        'blightwarden-crosscut-minion',
        'blightwarden',
        'pesteater',
        'warpgate',
      ],
      chat: ['chaoswhisperer', 'glyphsmith', 'bughunt', 'tavernkeeper'],
      excludedFromStatusDerivation: ['tavernkeeper'],
    });
  });

  it('VALID: chat => every chat role is also a declared role name', () => {
    const unknownChatRoles = workItemRoleStatics.chat.filter(
      (role) => !workItemRoleStatics.names.some((name) => name === role),
    );

    expect(unknownChatRoles).toStrictEqual([]);
  });

  it('VALID: excludedFromStatusDerivation => every excluded role is also a declared role name', () => {
    const unknownExcludedRoles = workItemRoleStatics.excludedFromStatusDerivation.filter(
      (role) => !workItemRoleStatics.names.some((name) => name === role),
    );

    expect(unknownExcludedRoles).toStrictEqual([]);
  });

  it('VALID: warpgate => is not a chat role and is not excluded from status derivation', () => {
    const warpgateIndex = workItemRoleStatics.names.indexOf('warpgate');
    const role = workItemRoleStatics.names[warpgateIndex];
    const isChatRole = workItemRoleStatics.chat.some((chatRole) => chatRole === role);
    const isExcludedRole = workItemRoleStatics.excludedFromStatusDerivation.some(
      (excludedRole) => excludedRole === role,
    );

    expect(isChatRole).toBe(false);
    expect(isExcludedRole).toBe(false);
  });
});
