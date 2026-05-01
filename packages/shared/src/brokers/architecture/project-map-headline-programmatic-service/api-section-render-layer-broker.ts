/**
 * PURPOSE: Renders the Public API section for a programmatic-service package. Groups method
 * names by domain using the prefix-to-domain mapping from statics and renders a fenced code
 * block per domain group.
 *
 * USAGE:
 * const section = apiSectionRenderLayerBroker({
 *   methodNames: [contentTextContract.parse('listGuilds'), contentTextContract.parse('startQuest')],
 *   namespaceName: contentTextContract.parse('StartOrchestrator'),
 * });
 * // Returns ContentText with ## Public API header + per-domain groups in a code block
 *
 * WHEN-TO-USE: project-map-headline-programmatic-service-broker building the Public API section
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapHeadlineProgrammaticServiceStatics } from '../../../statics/project-map-headline-programmatic-service/project-map-headline-programmatic-service-statics';
import { namespaceMethodsGroupByDomainTransformer } from '../../../transformers/namespace-methods-group-by-domain/namespace-methods-group-by-domain-transformer';

export const apiSectionRenderLayerBroker = ({
  methodNames,
  namespaceName,
}: {
  methodNames: ContentText[];
  namespaceName: ContentText;
}): ContentText => {
  const domainLookup = projectMapHeadlineProgrammaticServiceStatics.methodGroupPrefixes;
  const namespaceStr = String(namespaceName);
  const headerLine = `${projectMapHeadlineProgrammaticServiceStatics.apiSectionHeader} (${namespaceStr}.*)`;

  if (methodNames.length === 0) {
    return contentTextContract.parse(
      `${headerLine}\n\n${projectMapHeadlineProgrammaticServiceStatics.apiSectionEmpty}`,
    );
  }

  // Build ContentText-valued prefix map from statics entries — type inferred from context
  const prefixToDomain = Object.fromEntries(
    Object.entries(domainLookup).map(([k, v]) => [k, contentTextContract.parse(v)] as const),
  );

  const groups = namespaceMethodsGroupByDomainTransformer({ methodNames, prefixToDomain });

  const sectionParts: ContentText[] = [
    contentTextContract.parse(headerLine),
    contentTextContract.parse(''),
    contentTextContract.parse(projectMapHeadlineProgrammaticServiceStatics.apiSectionDescription),
    contentTextContract.parse(''),
    contentTextContract.parse('```'),
  ];

  const pad = projectMapHeadlineProgrammaticServiceStatics.methodNamePadWidth;

  for (const group of groups) {
    const domainLabel = `${String(group.domain)}:`;
    const paddedDomain = domainLabel.padEnd(pad);

    for (let i = 0; i < group.methods.length; i++) {
      const method = group.methods[i];
      if (method === undefined) continue;

      if (i === 0) {
        sectionParts.push(contentTextContract.parse(`${paddedDomain} ${String(method)}`));
      } else {
        sectionParts.push(contentTextContract.parse(`${''.padEnd(pad + 1)} ${String(method)}`));
      }
    }
  }

  sectionParts.push(contentTextContract.parse('```'));

  return contentTextContract.parse(sectionParts.map(String).join('\n'));
};
