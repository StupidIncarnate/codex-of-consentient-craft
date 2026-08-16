import { workItemRoleStatics } from './work-item-role-statics';

describe('workItemRoleStatics', () => {
  it('VALID: statics => matches the full expected object', () => {
    expect(workItemRoleStatics).toStrictEqual({
      names: [
        'chaoswhisperer',
        'glyphsmith',
        'bughunt',
        'tavernkeeper',
        'riftcarver',
        'codeweaver',
        'ward',
        'spiritmender',
        'flowrider',
        'groundstomper',
        'siegemaster',
        'pesteater',
        'warpgate',
      ],
      chat: ['chaoswhisperer', 'glyphsmith', 'bughunt', 'tavernkeeper'],
      command: ['ward', 'riftcarver'],
      excludedFromStatusDerivation: ['tavernkeeper'],
      postQuestChat: ['tavernkeeper'],
    });
  });

  it('VALID: chat => every chat role is also a declared role name', () => {
    const unknownChatRoles = workItemRoleStatics.chat.filter(
      (role) => !workItemRoleStatics.names.some((name) => name === role),
    );

    expect(unknownChatRoles).toStrictEqual([]);
  });

  it('VALID: command => every command role is also a declared role name', () => {
    const unknownCommandRoles = workItemRoleStatics.command.filter(
      (role) => !workItemRoleStatics.names.some((name) => name === role),
    );

    expect(unknownCommandRoles).toStrictEqual([]);
  });

  it('VALID: excludedFromStatusDerivation => every excluded role is also a declared role name', () => {
    const unknownExcludedRoles = workItemRoleStatics.excludedFromStatusDerivation.filter(
      (role) => !workItemRoleStatics.names.some((name) => name === role),
    );

    expect(unknownExcludedRoles).toStrictEqual([]);
  });

  it('VALID: postQuestChat => every post-quest-chat role is also a declared role name', () => {
    const unknownPostQuestChatRoles = workItemRoleStatics.postQuestChat.filter(
      (role) => !workItemRoleStatics.names.some((name) => name === role),
    );

    expect(unknownPostQuestChatRoles).toStrictEqual([]);
  });

  it('VALID: postQuestChat => every post-quest-chat role is also a chat role', () => {
    const nonChatPostQuestChatRoles = workItemRoleStatics.postQuestChat.filter(
      (role) => !workItemRoleStatics.chat.some((chatRole) => chatRole === role),
    );

    expect(nonChatPostQuestChatRoles).toStrictEqual([]);
  });

  it('VALID: groundstomper => is not a chat role, not excluded from status derivation, and not post-quest chat', () => {
    const groundstomperIndex = workItemRoleStatics.names.indexOf('groundstomper');
    const role = workItemRoleStatics.names[groundstomperIndex];
    const isChatRole = workItemRoleStatics.chat.some((chatRole) => chatRole === role);
    const isExcludedRole = workItemRoleStatics.excludedFromStatusDerivation.some(
      (excludedRole) => excludedRole === role,
    );
    const isPostQuestChatRole = workItemRoleStatics.postQuestChat.some(
      (postQuestChatRole) => postQuestChatRole === role,
    );

    expect(isChatRole).toBe(false);
    expect(isExcludedRole).toBe(false);
    expect(isPostQuestChatRole).toBe(false);
  });

  it('VALID: riftcarver => is a command role, and is not chat, not excluded from status derivation, and not post-quest chat', () => {
    const riftcarverIndex = workItemRoleStatics.names.indexOf('riftcarver');
    const role = workItemRoleStatics.names[riftcarverIndex];
    const isCommandRole = workItemRoleStatics.command.some((commandRole) => commandRole === role);
    const isChatRole = workItemRoleStatics.chat.some((chatRole) => chatRole === role);
    const isExcludedRole = workItemRoleStatics.excludedFromStatusDerivation.some(
      (excludedRole) => excludedRole === role,
    );
    const isPostQuestChatRole = workItemRoleStatics.postQuestChat.some(
      (postQuestChatRole) => postQuestChatRole === role,
    );

    expect(isCommandRole).toBe(true);
    expect(isChatRole).toBe(false);
    expect(isExcludedRole).toBe(false);
    expect(isPostQuestChatRole).toBe(false);
  });

  it('VALID: warpgate => is not a chat role, not excluded from status derivation, and not post-quest chat', () => {
    const warpgateIndex = workItemRoleStatics.names.indexOf('warpgate');
    const role = workItemRoleStatics.names[warpgateIndex];
    const isChatRole = workItemRoleStatics.chat.some((chatRole) => chatRole === role);
    const isExcludedRole = workItemRoleStatics.excludedFromStatusDerivation.some(
      (excludedRole) => excludedRole === role,
    );
    const isPostQuestChatRole = workItemRoleStatics.postQuestChat.some(
      (postQuestChatRole) => postQuestChatRole === role,
    );

    expect(isChatRole).toBe(false);
    expect(isExcludedRole).toBe(false);
    expect(isPostQuestChatRole).toBe(false);
  });
});
