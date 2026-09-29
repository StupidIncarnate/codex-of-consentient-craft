import { argv } from './argv';

const ORIGINAL_ARGV = [...argv];

const replaceArgv = ({ values }: { values: readonly string[] }): void => {
  argv.splice(0, argv.length, ...values);
};

// `argv` is the load-time `process.argv` ARRAY, so a staging reassigning `process.argv` would never
// reach a caller holding the capture: the proxy rewrites that one array in place instead. Creating it
// restores the original contents, so one test's staging never leaks into the next.
export const argvProxy = (): {
  setupArgv: (params: { argv: readonly string[] }) => void;
  restore: () => void;
} => {
  replaceArgv({ values: ORIGINAL_ARGV });

  return {
    setupArgv: ({ argv: values }: { argv: readonly string[] }): void => {
      replaceArgv({ values });
    },
    restore: (): void => {
      replaceArgv({ values: ORIGINAL_ARGV });
    },
  };
};
