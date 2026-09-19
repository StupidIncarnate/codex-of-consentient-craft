/**
 * PURPOSE: Renders an `InstanceManifest` into a concise, token-efficient human summary for the
 * `dungeonmaster siegelense start` CLI surface — instance id, spec, web and API URLs, throwaway
 * home, evidence directory, boot duration, and seeded ids if present. Pure, so the rendered
 * summary is provable without stdout.
 *
 * USAGE:
 * startAnswerRenderTransformer({ manifest: InstanceManifestStub() });
 * // Returns 'INSTANCE: inst_7f3a9c21 (dungeonmaster-stack)\n...'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { InstanceManifest } from '../../contracts/instance-manifest/instance-manifest-contract';

export const startAnswerRenderTransformer = ({
  manifest,
}: {
  manifest: InstanceManifest;
}): ContentText => {
  const url = manifest.url ?? manifest.baseUrl ?? '-';
  const apiUrl = manifest.apiUrl ?? '-';
  const home = manifest.paths?.home ?? manifest.home;
  const evidenceDir = manifest.paths?.evidenceDir ?? manifest.evidence.path;
  const seeded = manifest.seeded ? JSON.stringify(manifest.seeded) : 'none';

  return contentTextContract.parse(
    [
      `INSTANCE: ${manifest.instanceId} (${manifest.specName})`,
      `URL: ${url}`,
      `API: ${apiUrl}`,
      `HOME: ${home}`,
      `EVIDENCE: ${evidenceDir}`,
      `BOOT: ${manifest.bootMs}ms`,
      `SEEDED: ${seeded}`,
      '',
    ].join('\n'),
  );
};
