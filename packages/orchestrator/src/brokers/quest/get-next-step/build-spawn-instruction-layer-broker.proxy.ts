import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const buildSpawnInstructionLayerBrokerProxy = (): {
  getDeclinedPromptReports: () => readonly unknown[];
} => {
  // The broker reports every step whose prompt it could not dispatch under on stderr. Capture it
  // so test output stays clean and tests can assert on `process.stderr.write` that a fallback to
  // the work item's own role is never silent.
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.calledWith([]).implement(() => true);

  return {
    getDeclinedPromptReports: (): readonly unknown[] =>
      stderrSpy
        .callsMatching([])
        .map((call) => call[0])
        .filter((line) => String(line).startsWith('[dispatch-role]')),
  };
};
