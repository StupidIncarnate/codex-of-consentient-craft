/**
 * PURPOSE: Turns the result of the `dungeonmaster gateway-sync` run the post-bash hook starts into
 * the one message the agent reads after its `npm install <pkg>`. A failed or stopped sync is told
 * apart from a clean one and names the command to re-run, since the hook itself never blocks.
 *
 * USAGE:
 * gatewaySyncReportMessageTransformer({ exitCode: 0, output: 'generated: left-pad\n', timedOut: false });
 * // Returns 'dungeonmaster gateway-sync ran after this npm install:\ngenerated: left-pad'
 */

import { gatewaySyncHookStatics } from '../../statics/gateway-sync-hook/gateway-sync-hook-statics';

export const gatewaySyncReportMessageTransformer = ({
  exitCode,
  output,
  timedOut,
}: {
  exitCode: number;
  output: string;
  timedOut: boolean;
}): string => {
  const { display } = gatewaySyncHookStatics.command;
  const body = output.trim() === '' ? '(no output)' : output.trim();

  if (timedOut) {
    return `${display} was stopped before it finished after this npm install. Run \`${display}\` yourself so packages/@gateway/npm/src gets a folder for the new package. Output so far:\n${body}`;
  }

  if (exitCode !== 0) {
    return `${display} exited ${String(exitCode)} after this npm install, so packages/@gateway/npm/src may lack a folder for the new package. Fix the cause and run \`${display}\` again. Output:\n${body}`;
  }

  return `${display} ran after this npm install:\n${body}`;
};
