/**
 * PURPOSE: Names the gateway packages `dungeonmaster init` scaffolds, per `scrolls/adapters-to-one-place.md`
 * ("Naming in a repo with no scope"): a root package.json named `@acme/app` gives the scope `@acme`; an
 * unscoped root name `acme-app` gives `@acme-app`. Reach for this over workspaceScopeDetectTransformer,
 * which infers a scope from an EXISTING scoped workspace dependency — wrong here, since a fresh consumer
 * repo may have no workspace-scoped dependency yet and the gateway's own scope always comes from the
 * root package.json's OWN name.
 *
 * USAGE:
 * gatewayScopeDetectTransformer({ rootPackageJsonName: '@acme/app', fallbackName: PathSegmentStub({value: 'app'}) });
 * // Returns '@acme'
 * gatewayScopeDetectTransformer({ rootPackageJsonName: 'acme-app', fallbackName: PathSegmentStub({value: 'app'}) });
 * // Returns '@acme-app'
 */

import { pathSegmentContract, type PathSegment } from '@dungeonmaster/shared/contracts';

export const gatewayScopeDetectTransformer = ({
  rootPackageJsonName,
  fallbackName,
}: {
  rootPackageJsonName: string | undefined;
  fallbackName: PathSegment;
}): PathSegment => {
  const candidate =
    rootPackageJsonName !== undefined && rootPackageJsonName.length > 0
      ? rootPackageJsonName
      : String(fallbackName);

  const scope =
    candidate.startsWith('@') && candidate.includes('/')
      ? candidate.slice(0, candidate.indexOf('/'))
      : `@${candidate}`;

  return pathSegmentContract.parse(scope);
};
