/**
 * PURPOSE: Returns ToolRegistration[] for the three siegelense MCP tools a session with a live
 * instance drives — `siegelense-start`, `siegelense-run` and `siegelense-kill`. The other ten pinned
 * names in `siegelenseToolsStatics.tools.names` stay unregistered until the chunk that implements each
 * one lands its own registration (chunk-02-driver-and-batch.md §3: register the tools a chunk
 * IMPLEMENTS, as that chunk lands them) — a tool nobody can call cannot be verified by a person, and
 * `docs` in particular stays unregistered on purpose: it is how a session LEARNS this surface, and a
 * manual describing calls that do not exist is the exact failure `docs` is meant to prevent.
 *
 * USAGE:
 * const registrations = SiegelenseFlow();
 * // Returns 3 ToolRegistration objects that delegate to SiegelenseHandleResponder
 */

import { zodToJsonSchema } from 'zod-to-json-schema';

import { siegelenseToolsStatics } from '@dungeonmaster/siegelense/statics';

import { siegelenseKillInputContract } from '../../contracts/siegelense-kill-input/siegelense-kill-input-contract';
import { siegelenseRunInputContract } from '../../contracts/siegelense-run-input/siegelense-run-input-contract';
import { siegelenseStartInputContract } from '../../contracts/siegelense-start-input/siegelense-start-input-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import { SiegelenseHandleResponder } from '../../responders/siegelense/handle/siegelense-handle-responder';

const jsonSchemaOptions = { $refStrategy: 'none' as const };
const startSchema = zodToJsonSchema(siegelenseStartInputContract as never, jsonSchemaOptions);
const runSchema = zodToJsonSchema(siegelenseRunInputContract as never, jsonSchemaOptions);
const killSchema = zodToJsonSchema(siegelenseKillInputContract as never, jsonSchemaOptions);

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
    name: `${prefix}kill` as never,
    description:
      'Stops one running instance. Accepts an already-dead instance id too, reaping its orphaned process groups from its heartbeat file when the driver itself is unreachable.' as never,
    inputSchema: killSchema as never,
    handler: async ({ args }) =>
      SiegelenseHandleResponder({ tool: `${prefix}kill` as never, args }),
  },
];
