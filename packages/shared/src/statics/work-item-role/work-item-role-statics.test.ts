import { workItemRoleStatics } from './work-item-role-statics';

describe('workItemRoleStatics', () => {
  it('VALID: statics => matches the full expected object', () => {
    expect(workItemRoleStatics).toStrictEqual({
      names: [
        'chaoswhisperer',
        'glyphsmith',
        'bughunt',
        'codeweaver',
        'ward',
        'spiritmender',
        'flowrider',
        'siegemaster',
        'blightwarden-group-minion',
        'blightwarden-crosscut-minion',
        'blightwarden',
        'pesteater',
      ],
      chat: ['chaoswhisperer', 'glyphsmith', 'bughunt'],
    });
  });

  it('VALID: chat => every chat role is also a declared role name', () => {
    const unknownChatRoles = workItemRoleStatics.chat.filter(
      (role) => !workItemRoleStatics.names.some((name) => name === role),
    );

    expect(unknownChatRoles).toStrictEqual([]);
  });
});
