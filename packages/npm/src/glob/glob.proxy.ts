import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';

const resolvedOptions = ({
  cwd,
  nodir,
  ignore,
}: {
  cwd?: string;
  nodir?: boolean;
  ignore: readonly string[];
}): { cwd?: string; absolute: true; nodir: boolean; ignore: string[] } => ({
  ...(cwd === undefined ? {} : { cwd }),
  absolute: true,
  nodir: nodir ?? true,
  ignore: [...ignore],
});

export const globProxy = (): {
  returns: (params: {
    pattern: string | string[];
    options: { cwd?: string; nodir?: boolean; ignore: readonly string[] };
    matches: string[];
  }) => void;
  throws: (params: {
    pattern: string | string[];
    options: { cwd?: string; nodir?: boolean; ignore: readonly string[] };
    error: Error;
  }) => void;
} => {
  const handle = registerMock({ fn: glob });

  return {
    returns: ({ pattern, options, matches }): void => {
      handle.calledWith([pattern, resolvedOptions(options)]).resolves(matches);
    },
    throws: ({ pattern, options, error }): void => {
      handle.calledWith([pattern, resolvedOptions(options)]).rejects(error);
    },
  };
};
