import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const serverPackageVersionAdapterProxy = (): {
  stagesVersion: ({ version }: { version: string }) => void;
  stagesMissingVersion: () => void;
  readFails: ({ error }: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: readFileSync });

  return {
    // No path to key on: this adapter reads exactly one file, its own package.json.
    stagesVersion: ({ version }: { version: string }): void => {
      handle.calledWith([]).returns(JSON.stringify({ version }));
    },
    stagesMissingVersion: (): void => {
      handle.calledWith([]).returns(JSON.stringify({}));
    },
    readFails: ({ error }: { error: Error }): void => {
      handle.calledWith([]).throws(error);
    },
  };
};
