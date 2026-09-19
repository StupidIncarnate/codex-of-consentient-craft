/**
 * PURPOSE: What `start` hands back — an instance id, the URL to open a browser against, the throwaway
 * home, and every path a session will want tomorrow, because there is no LOOKUP call to recover one
 * later (siegelense-tooling.md lines 2162–2164). `baseUrl` is `.nullable()`, never a live-looking URL
 * by default: a `dungeonmaster-api` spec binds no `web` port (spec line 2145 — "A BROWSERLESS
 * spec is just another spec"), so a caller that only checks "is this field present" before opening it
 * would otherwise get a URL nothing answers, with nothing saying why. `null` here means exactly "this
 * spec never claimed a web surface" — never "the surface failed to come up," which is what
 * `LaneBootFailedError` is for. `evidence` and both `logs` entries are `RepoLocalPath`,
 * never a bare `AbsoluteFilePath`, because a shot is only evidence if the reader's `Read` can reach it
 * (line 165) and a repo that has never run `init` still needs an honest answer rather than a path that
 * silently stops resolving. The guild folded into `evidence`'s and each log's underlying path is the
 * PARTITION guild — the one that owns `quest`, or `unowned` when there is none — never a guild a
 * recipe seeds fresh inside the throwaway home for this run; keying evidence by a seeded guild would
 * file every instance under a partition of its own and defeat the point (line 2158). `seeded` is
 * where that seeded guild DOES appear: the ids `--seed <recipe>` made, keyed by the names that
 * recipe's manifest declares (line 2308). `null` means no `--seed` was given, which is a different
 * answer from `{}` — a recipe that ran and returned nothing — and the two must not read alike.
 * `queuedMs` and `aheadOfMe` are why a slow boot and a hang read differently: without `queuedMs` a
 * 55-second `start` is indistinguishable from one that will never return (line 1473).
 *
 * USAGE:
 * instanceManifestContract.parse({
 *   instanceId: 'inst_7f3a9c21',
 *   specName: 'dungeonmaster-stack',
 *   baseUrl: 'http://localhost:34173',
 *   home: '/tmp/dm-siege-inst_7f3a9c21',
 *   evidence: { path: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21', linkPresent: true },
 *   logs: {
 *     api: { path: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/api-server.log', linkPresent: true },
 *     web: { path: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/web-server.log', linkPresent: true },
 *   },
 *   seeded: { guildSlug: 'siege-guild', guildId: '7306b468-…' },
 *   queuedMs: 34000,
 *   aheadOfMe: 2,
 *   bootMs: 21000,
 * });
 * // Returns a validated InstanceManifest
 */

import { z } from 'zod';

import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';

import { recipeResultContract } from '@dungeonmaster/siegelense-recipes/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';
import { repoLocalPathContract } from '../repo-local-path/repo-local-path-contract';
import { specNameContract } from '../spec-name/spec-name-contract';

export const instanceManifestContract = z.object({
  instanceId: instanceIdContract,
  specName: specNameContract,
  baseUrl: contentTextContract.nullable(),
  url: contentTextContract.optional(),
  apiUrl: contentTextContract.optional(),
  home: absoluteFilePathContract,
  evidence: repoLocalPathContract,
  paths: z
    .object({
      home: absoluteFilePathContract,
      evidenceDir: contentTextContract,
    })
    .optional(),
  logs: z.object({
    api: repoLocalPathContract,
    web: repoLocalPathContract,
  }),
  seeded: recipeResultContract.nullable(),
  queuedMs: epochMsContract,
  aheadOfMe: readingCountContract,
  bootMs: epochMsContract,
});

export type InstanceManifest = z.infer<typeof instanceManifestContract>;
