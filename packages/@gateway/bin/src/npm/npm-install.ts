/**
 * PURPOSE: `npm install` at a target repo root — reach for this over hand-rolling a spawn, matching
 * every other command-specific function in this module.
 *
 * USAGE:
 * const { exitCode, output } = await install({ cwd: '/repo' });
 */

import { npmRun } from './npm-run';

export const install = async ({
  cwd,
}: {
  cwd: string;
}): Promise<{ exitCode: number; output: string }> => {
  const { exitCode, output } = await npmRun({ args: ['install'], cwd });
  return { exitCode, output };
};
