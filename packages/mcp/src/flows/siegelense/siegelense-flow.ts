/**
 * PURPOSE: Returns ToolRegistration[] for the seven registered siegelense MCP tools —
 * `siegelense-start`, `siegelense-run`, `siegelense-results`, `siegelense-kill`, `siegelense-status`,
 * `siegelense-cleanup` and `siegelense-compare`. The other six pinned names in
 * `siegelenseToolsStatics.tools.names` stay unregistered until the chunk that implements each one
 * lands its own registration (chunk-02-driver-and-batch.md §3: register the tools a chunk
 * IMPLEMENTS, as that chunk lands them) — a tool nobody can call cannot be verified by a person, and
 * `docs` in particular stays unregistered on purpose: it is how a session LEARNS this surface, and a
 * manual describing calls that do not exist is the exact failure `docs` is meant to prevent. The
 * registration order below follows `siegelenseToolsStatics.tools.names`' own declared order, which
 * is what the colocated integration test's derived `expectedNames` list checks against.
 *
 * USAGE:
 * const registrations = SiegelenseFlow();
 * // Returns 7 ToolRegistration objects that delegate to SiegelenseHandleResponder
 */

import { zodToJsonSchema } from 'zod-to-json-schema';

import { siegelenseToolsStatics } from '@dungeonmaster/siegelense/statics';

import { siegelenseCleanupInputContract } from '../../contracts/siegelense-cleanup-input/siegelense-cleanup-input-contract';
import { siegelenseCompareInputContract } from '../../contracts/siegelense-compare-input/siegelense-compare-input-contract';
import { siegelenseKillInputContract } from '../../contracts/siegelense-kill-input/siegelense-kill-input-contract';
import { siegelenseResultsInputContract } from '../../contracts/siegelense-results-input/siegelense-results-input-contract';
import { siegelenseRunInputContract } from '../../contracts/siegelense-run-input/siegelense-run-input-contract';
import { siegelenseStartInputContract } from '../../contracts/siegelense-start-input/siegelense-start-input-contract';
import { siegelenseStatusInputContract } from '../../contracts/siegelense-status-input/siegelense-status-input-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import { SiegelenseHandleResponder } from '../../responders/siegelense/handle/siegelense-handle-responder';

const jsonSchemaOptions = { $refStrategy: 'none' as const };
const startSchema = zodToJsonSchema(siegelenseStartInputContract as never, jsonSchemaOptions);
const runSchema = zodToJsonSchema(siegelenseRunInputContract as never, jsonSchemaOptions);
const resultsSchema = zodToJsonSchema(siegelenseResultsInputContract as never, jsonSchemaOptions);
const killSchema = zodToJsonSchema(siegelenseKillInputContract as never, jsonSchemaOptions);
const statusSchema = zodToJsonSchema(siegelenseStatusInputContract as never, jsonSchemaOptions);
const cleanupSchema = zodToJsonSchema(siegelenseCleanupInputContract as never, jsonSchemaOptions);
const compareSchema = zodToJsonSchema(siegelenseCompareInputContract as never, jsonSchemaOptions);

const { prefix } = siegelenseToolsStatics.tools;

export const SiegelenseFlow = (): ToolRegistration[] => [
  {
    name: `${prefix}start` as never,
    description:
      'Boots one siegelense instance for the given lane spec and blocks until the driver answers or the boot deadline passes. Returns the manifest — instance id, base URL, and every evidence path this run will want, since there is no lookup call to recover them later.' as never,
    inputSchema: startSchema as never,
    handler: async ({ args }) =>
      SiegelenseHandleResponder({ tool: `${prefix}start` as never, args }),
  },
  {
    name: `${prefix}run` as never,
    description:
      "Submits one batch of steps to a running instance and blocks until it finishes. Returns a STATUS — an index and a shot list — never the steps' own payloads; query those afterward with siegelense-results." as never,
    inputSchema: runSchema as never,
    handler: async ({ args }) => SiegelenseHandleResponder({ tool: `${prefix}run` as never, args }),
  },
  {
    name: `${prefix}results` as never,
    description:
      "Reads evidence off disk for one instance — console, network, ws, server, screenshots or steps. Starts nothing and holds no pool slot, so a query against a dead, killed or pruned instance still answers. Against a finished instance you must name a runId (or since: 'boot'); omit both and the call refuses rather than guessing which run you meant." as never,
    inputSchema: resultsSchema as never,
    handler: async ({ args }) =>
      SiegelenseHandleResponder({ tool: `${prefix}results` as never, args }),
  },
  {
    name: `${prefix}kill` as never,
    description:
      'Stops one running instance. Accepts an already-dead instance id too, reaping its orphaned process groups from its heartbeat file when the driver itself is unreachable.' as never,
    inputSchema: killSchema as never,
    handler: async ({ args }) =>
      SiegelenseHandleResponder({ tool: `${prefix}kill` as never, args }),
  },
  {
    name: `${prefix}status` as never,
    description:
      "Reports the fleet — every instance's lifecycle state and last-seen timing, alive or dead — with no runs or evidence for any of them. Name an instanceId to get that one instance in full instead: last beat, last step, RSS, orphans, evidence paths, likelyCause. Never lists another instance's runs or evidence unless you name it." as never,
    inputSchema: statusSchema as never,
    handler: async ({ args }) =>
      SiegelenseHandleResponder({ tool: `${prefix}status` as never, args }),
  },
  {
    name: `${prefix}cleanup` as never,
    description:
      'Reaps every stale instance the registry holds, releases their ports and the boot/registry lock where each has outlived its TTL, and reports every live or booting instance it left alone with why. Takes no input. Reaps and releases only — it ages no asset, so a clean baseline capture is never touched by this call.' as never,
    inputSchema: cleanupSchema as never,
    handler: async ({ args }) =>
      SiegelenseHandleResponder({ tool: `${prefix}cleanup` as never, args }),
  },
  {
    name: `${prefix}compare` as never,
    description:
      "Diffs two runs of ONE instance's timeline — console and server error deltas, network non-2xx deltas, and a last-capture pixel change. A READING, never a verdict on whether a unit passes. There is no cross-instance form: name one instanceId and two runs (runA, runB) inside its own timeline — two different instances share nothing but a spec. An instanceId the registry never held fails with an error naming it unknown; a known instance whose named run never stored a return fails with an error naming that run missing — neither ever answers with a filesystem path." as never,
    inputSchema: compareSchema as never,
    handler: async ({ args }) =>
      SiegelenseHandleResponder({ tool: `${prefix}compare` as never, args }),
  },
];
