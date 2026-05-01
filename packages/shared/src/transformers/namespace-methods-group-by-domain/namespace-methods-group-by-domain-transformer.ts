/**
 * PURPOSE: Groups a flat list of method names by domain using a prefix-to-domain mapping.
 * Methods not present in the mapping are placed under an "Other" group.
 *
 * USAGE:
 * const groups = namespaceMethodsGroupByDomainTransformer({
 *   methodNames: [contentTextContract.parse('listGuilds'), contentTextContract.parse('startQuest')],
 *   prefixToDomain: { listGuilds: 'Guilds', startQuest: 'Orchestration' },
 * });
 * // Returns [{ domain: ContentText('Guilds'), methods: [ContentText] }, ...]
 *
 * WHEN-TO-USE: project-map-headline-programmatic-service-broker grouping public API methods for display
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import type { MethodDomainGroup } from '../../contracts/method-domain-group/method-domain-group-contract';

export const namespaceMethodsGroupByDomainTransformer = ({
  methodNames,
  prefixToDomain,
}: {
  methodNames: ContentText[];
  prefixToDomain: Readonly<Record<string, ContentText>>;
}): MethodDomainGroup[] => {
  const otherDomain = contentTextContract.parse('Other');

  // domainOrder preserves insertion order; domainGroups maps domain string to methods
  const domainOrder: ContentText[] = [];
  const domainGroups = new Map<ContentText, ContentText[]>();

  for (const methodName of methodNames) {
    const nameStr = String(methodName);
    const domain = prefixToDomain[nameStr] ?? otherDomain;
    const domainStr = String(domain);

    const existingDomainKey = domainOrder.find((d) => String(d) === domainStr);

    if (existingDomainKey === undefined) {
      domainOrder.push(domain);
      domainGroups.set(domain, [methodName]);
    } else {
      domainGroups.get(existingDomainKey)?.push(methodName);
    }
  }

  return domainOrder.map((domain) => ({
    domain,
    methods: domainGroups.get(domain) ?? [],
  }));
};
