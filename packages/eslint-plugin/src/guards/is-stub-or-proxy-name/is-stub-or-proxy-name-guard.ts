/**
 * PURPOSE: Tells whether an imported or re-exported name is a stub's or a proxy's, by the suffix every one carries (`QuestStub`, `questGetBrokerProxy`). It catches the name when the specifier hides the file, as a barrel does.
 *
 * USAGE:
 * isStubOrProxyNameGuard({ name: 'QuestStub' });
 * // Returns true
 * isStubOrProxyNameGuard({ name: 'questContract' });
 * // Returns false
 */
export const isStubOrProxyNameGuard = ({ name }: { name?: string | undefined }): boolean =>
  name !== undefined && /(?:Stub|Proxy)$/u.test(name);
