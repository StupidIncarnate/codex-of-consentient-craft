// process.chdir is a real, process-wide change, so this proxy remembers the directory the test
// started in and puts it back on `restore` — a caller's own proxy calls it in the same teardown
// path that removes the directory it changed into.
export const chdirProxy = (): { restore: () => void } => {
  const startingDirectory = process.cwd();

  return {
    restore: (): void => {
      process.chdir(startingDirectory);
    },
  };
};
