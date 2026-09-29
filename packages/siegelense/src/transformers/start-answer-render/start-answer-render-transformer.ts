/**
 * PURPOSE: Renders an `InstanceManifest` into a concise, token-efficient human summary for the
 * `dungeonmaster siegelense start` CLI surface — instance id, spec, web and API URLs, throwaway
 * home, evidence directory, boot duration, the idle timeout the served lane will reap itself at
 * (`idleTimeoutMs` omitted means the default), and one summary line per seeded binding: its id, plus the
 * `seedRowSummaryStatics` identity fields the row carries. A binding whose seed value is already a
 * bare id (the flat arm of `SeedResult`) renders as just that id — there is no row to summarise.
 * `--json` on the same responder call serializes the whole `InstanceManifest` unabridged, seeded
 * rows included, plus `idleTimeoutMs`; this is the only surface that trims a row, and only for the human view. Pure, so
 * the rendered summary is provable without stdout.
 *
 * USAGE:
 * startAnswerRenderTransformer({ manifest: InstanceManifestStub() });
 * // Returns 'INSTANCE: inst_7f3a9c21 (dungeonmaster-stack)\n...SEEDED: none\n'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, TimeoutMs } from '@dungeonmaster/shared/contracts';

import type { InstanceManifest } from '../../contracts/instance-manifest/instance-manifest-contract';
import { driverStatics } from '../../statics/driver/driver-statics';
import { seedRowSummaryStatics } from '../../statics/seed-row-summary/seed-row-summary-statics';

const MS_PER_MINUTE = 60_000;

export const startAnswerRenderTransformer = ({
  manifest,
  idleTimeoutMs,
}: {
  manifest: InstanceManifest;
  idleTimeoutMs?: TimeoutMs | undefined;
}): ContentText => {
  const effectiveMs = idleTimeoutMs ?? driverStatics.idle.timeoutMs;
  const [defaultLabel, effectiveLabel] = [driverStatics.idle.timeoutMs, effectiveMs].map((ms) =>
    ms % MS_PER_MINUTE === 0 ? `${String(ms / MS_PER_MINUTE)}m` : `${String(ms)}ms`,
  );
  const idleTimeoutLine =
    effectiveMs === driverStatics.idle.timeoutMs
      ? `IDLE TIMEOUT: ${String(defaultLabel)} (default)`
      : `IDLE TIMEOUT: ${String(effectiveLabel)} (raised from the ${String(defaultLabel)} default)`;
  const url = manifest.url ?? manifest.baseUrl ?? '-';
  const apiUrl = manifest.apiUrl ?? '-';
  const home = manifest.paths?.home ?? manifest.home;
  const evidenceDir = manifest.paths?.evidenceDir ?? manifest.evidence.path;
  const { seeded } = manifest;
  const seededEntries = seeded === null ? null : Object.entries(seeded);

  const seededLines =
    seededEntries === null
      ? ['SEEDED: none']
      : seededEntries.length === 0
        ? ['SEEDED: (empty)']
        : [
            'SEEDED:',
            ...seededEntries.map(([binding, value]) => {
              if (typeof value === 'string') {
                return `  ${binding}: ${value}`;
              }
              if (value === undefined) {
                return `  ${binding}: -`;
              }

              const rowEntries = Object.entries(value);
              const idEntry = seedRowSummaryStatics.primaryId.fieldOrder.reduce<
                (typeof rowEntries)[0] | undefined
              >((found, fieldName) => {
                if (found !== undefined) {
                  return found;
                }
                return rowEntries.find(
                  ([key, fieldValue]) => key === fieldName && typeof fieldValue === 'string',
                );
              }, undefined);
              const id = idEntry !== undefined && typeof idEntry[1] === 'string' ? idEntry[1] : '-';

              const identityEntries = seedRowSummaryStatics.identity.fieldOrder.reduce<
                typeof rowEntries
              >((accumulated, fieldName) => {
                if (accumulated.length >= seedRowSummaryStatics.identity.maxFields) {
                  return accumulated;
                }
                const match = rowEntries.find(
                  ([key, fieldValue]) => key === fieldName && typeof fieldValue === 'string',
                );
                return match === undefined ? accumulated : [...accumulated, match];
              }, []);

              const identitySuffix =
                identityEntries.length === 0
                  ? ''
                  : ` (${identityEntries
                      .map(([key, fieldValue]) => `${key}: ${String(fieldValue)}`)
                      .join(', ')})`;

              return `  ${binding}: ${id}${identitySuffix}`;
            }),
          ];

  return contentTextContract.parse(
    [
      `INSTANCE: ${manifest.instanceId} (${manifest.specName})`,
      `URL: ${url}`,
      `API: ${apiUrl}`,
      `HOME: ${home}`,
      `EVIDENCE: ${evidenceDir}`,
      `BOOT: ${manifest.bootMs}ms`,
      idleTimeoutLine,
      ...seededLines,
      '',
    ].join('\n'),
  );
};
