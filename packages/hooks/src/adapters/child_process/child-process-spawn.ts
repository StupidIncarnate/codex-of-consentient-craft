import { spawn, type SpawnOptions, type ChildProcess } from 'child_process';

export type { SpawnOptions, ChildProcess };

export const childProcessSpawn = ({
  command,
  args = [],
  options = {},
}: {
  command: string;
  args?: string[];
  options?: SpawnOptions;
}): ChildProcess => spawn(command, args, options);
