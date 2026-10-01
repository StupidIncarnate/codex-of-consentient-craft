/**
 * PURPOSE: Handles PostToolUse events on the Bash tool. When the command added npm packages
 * (`isNpmInstallWithPackagesCommandGuard`), it runs `dungeonmaster gateway-sync` in the session's
 * cwd and hands its report back to the agent as PostToolUse context. npm runs no root `postinstall`
 * for `npm install <pkg>`, so without this an agent's new dependency gets no gateway folder. Every
 * outcome exits 0: a failed or missing sync becomes a message, never a blocked or failed tool call.
 *
 * USAGE:
 * const result = await HookPostBashResponder({ inputData: rawHookJson });
 * // Returns ExecResult: stdout carries the PostToolUse JSON when a sync ran, '' otherwise; exitCode 0
 */

import { run } from '#gateway/node/child_process';
import { execResultContract, type ExecResult } from '@dungeonmaster/shared/contracts';

import { bashToolInputContract } from '../../../contracts/bash-tool-input/bash-tool-input-contract';
import { postToolUseHookDataContract } from '../../../contracts/post-tool-use-hook-data/post-tool-use-hook-data-contract';
import { isNpmInstallWithPackagesCommandGuard } from '../../../guards/is-npm-install-with-packages-command/is-npm-install-with-packages-command-guard';
import { gatewaySyncHookStatics } from '../../../statics/gateway-sync-hook/gateway-sync-hook-statics';
import { hookExitCodeStatics } from '../../../statics/hook-exit-code/hook-exit-code-statics';
import { gatewaySyncReportMessageTransformer } from '../../../transformers/gateway-sync-report-message/gateway-sync-report-message-transformer';
import { wrapPostToolUseOutputTransformer } from '../../../transformers/wrap-post-tool-use-output/wrap-post-tool-use-output-transformer';

export const HookPostBashResponder = async ({
  inputData,
}: {
  inputData: string;
}): Promise<ExecResult> => {
  const silentResult = execResultContract.parse({
    stdout: '',
    stderr: '',
    exitCode: hookExitCodeStatics.success,
  });

  const hookParsed = postToolUseHookDataContract.safeParse(JSON.parse(inputData));
  if (
    !hookParsed.success ||
    String(hookParsed.data.tool_name) !== gatewaySyncHookStatics.hook.matcher
  ) {
    return silentResult;
  }

  const bashParsed = bashToolInputContract.safeParse(hookParsed.data.tool_input);
  if (
    !bashParsed.success ||
    !isNpmInstallWithPackagesCommandGuard({ command: bashParsed.data.command })
  ) {
    return silentResult;
  }

  const { display } = gatewaySyncHookStatics.command;

  const content = await run({
    command: gatewaySyncHookStatics.command.name,
    args: [...gatewaySyncHookStatics.command.args],
    cwd: hookParsed.data.cwd,
    timeout: gatewaySyncHookStatics.limits.runTimeoutMs,
  })
    .then((result) =>
      gatewaySyncReportMessageTransformer({
        exitCode: result.exitCode,
        output: result.output,
        timedOut: result.timedOut,
      }),
    )
    .catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : String(error);
      return `${display} did not run after this npm install: ${reason}. Run \`${display}\` yourself so packages/@gateway/npm/src gets a folder for the new package.`;
    });

  return execResultContract.parse({
    stdout: wrapPostToolUseOutputTransformer({ content }),
    stderr: '',
    exitCode: hookExitCodeStatics.success,
  });
};
