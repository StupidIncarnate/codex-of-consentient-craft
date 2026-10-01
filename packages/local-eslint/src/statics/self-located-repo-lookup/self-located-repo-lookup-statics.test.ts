import { selfLocatedRepoLookupStatics } from './self-located-repo-lookup-statics';

describe('selfLocatedRepoLookupStatics', () => {
  describe('resolverNames', () => {
    it('VALID: resolverNames => equals every resolver that walks up to a repo root, scope, workspace or config', () => {
      expect(selfLocatedRepoLookupStatics.resolverNames).toStrictEqual([
        'repoScopeResolveBroker',
        'workspaceRootFindBroker',
        'configGatewayLintConfigBroker',
        'configWorkspacePackageNamesBroker',
        'gatewayLintConfigReadBroker',
        'resolveGatewayScopeLayerBroker',
        'cwdResolveBroker',
        'configRootFindBroker',
        'portResolveBroker',
      ]);
    });
  });

  describe('selfLocationIdentifiers', () => {
    it('VALID: selfLocationIdentifiers => equals the two CommonJS module-location names', () => {
      expect(selfLocatedRepoLookupStatics.selfLocationIdentifiers).toStrictEqual([
        '__dirname',
        '__filename',
      ]);
    });
  });

  describe('ownPackageKind', () => {
    it('VALID: ownPackageKind => equals the kind property asking for the nearest package.json', () => {
      expect(selfLocatedRepoLookupStatics.ownPackageKind).toStrictEqual({
        propertyName: 'kind',
        value: 'project-root',
      });
    });
  });
});
