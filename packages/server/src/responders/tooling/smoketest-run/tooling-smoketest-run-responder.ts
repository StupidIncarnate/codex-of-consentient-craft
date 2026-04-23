/**
 * PURPOSE: Validates POST /api/tooling/smoketest/run body and delegates to the orchestrator adapter
 *
 * USAGE:
 * const result = await ToolingSmoketestRunResponder({ body: { suite: 'mcp' } });
 * // Returns: { status, data: { runId, results } | { error } }
 */

import { filePathContract, smoketestSuiteContract } from '@dungeonmaster/shared/contracts';
import { configRootFindBroker } from '@dungeonmaster/shared/brokers';

import { orchestratorRunSmoketestAdapter } from '../../../adapters/orchestrator/run-smoketest/orchestrator-run-smoketest-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const ToolingSmoketestRunResponder = async ({
  body,
}: {
  body: unknown;
}): Promise<ResponderResult> => {
  try {
    const rawSuite: unknown =
      typeof body === 'object' && body !== null ? Reflect.get(body, 'suite') : undefined;
    const suite = smoketestSuiteContract.parse(rawSuite);
    // Use the repo root (directory containing `.dungeonmaster.json`) — not process.cwd() — because
    // npm workspace scripts set cwd to the workspace package dir (e.g. packages/server), but the
    // spawned Claude subprocess needs to run from the repo root so it can discover `.mcp.json` for
    // the dungeonmaster MCP server. `projectRootFindBroker` can't be used because it stops at the
    // first package.json (the workspace member); `configRootFindBroker` walks up to the repo-level
    // .dungeonmaster.json.
    const projectRoot = await configRootFindBroker({
      startPath: filePathContract.parse(process.cwd()),
    });
    const startPath = filePathContract.parse(projectRoot);

    const result = await orchestratorRunSmoketestAdapter({ suite, startPath });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run smoketest';
    const status = message.startsWith('Smoketest already running')
      ? httpStatusStatics.clientError.conflict
      : httpStatusStatics.serverError.internal;
    return responderResultContract.parse({
      status,
      data: { error: message },
    });
  }
};
