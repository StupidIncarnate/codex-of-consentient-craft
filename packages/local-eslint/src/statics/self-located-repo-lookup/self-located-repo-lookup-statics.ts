/**
 * PURPOSE: Configuration for the ban-self-located-repo-lookup rule: the resolvers that find a
 * repo's root, scope, workspace or config by walking up from a path they are given, the module
 * identifiers that name the calling module's own location, and the one `kind` that asks for the
 * calling module's own package.
 *
 * USAGE:
 * selfLocatedRepoLookupStatics.resolverNames;
 * // ['repoScopeResolveBroker', 'workspaceRootFindBroker', ...]
 */
export const selfLocatedRepoLookupStatics = {
  // Each one walks up from the path it is given and answers for the repo it finds there. Passing
  // the caller's own location finds dungeonmaster's checkout when a consumer links dungeonmaster
  // through `file:`, instead of the consumer's repo.
  resolverNames: [
    'repoScopeResolveBroker',
    'workspaceRootFindBroker',
    'configGatewayLintConfigBroker',
    'configWorkspacePackageNamesBroker',
    'gatewayLintConfigReadBroker',
    'resolveGatewayScopeLayerBroker',
    'cwdResolveBroker',
    'configRootFindBroker',
    'portResolveBroker',
  ],
  // A CommonJS module's own location. `import.meta` is matched by node kind, not by name.
  selfLocationIdentifiers: ['__dirname', '__filename'],
  // `cwdResolveBroker({ kind: 'project-root' })` finds the nearest package.json, which for the
  // caller's own location is the caller's own package: reading your own package is allowed.
  ownPackageKind: {
    propertyName: 'kind',
    value: 'project-root',
  },
} as const;
