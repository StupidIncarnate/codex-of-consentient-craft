/**
 * PURPOSE: What ward says when a run is red for a reason no single file failed on. Reach for this
 * over spelling the wording at the call site — `commandRunBroker` prints it and the tests assert it.
 *
 * USAGE:
 * qualityGateStatics.slowFiles.heading;
 * // Returns the line ward prints before exiting 1 over slow suites
 */
export const qualityGateStatics = {
  slowFiles: {
    // One note per runner, because each carries a different startup cost in its wall figure. A jest
    // suite's wall carries the package's one-time compile and eslint's carries the TypeScript
    // program build; Playwright has neither, and saying so anyway would tell a reader to discount
    // the very number the e2e list is ranked on.
    jestNote:
      "ranked on test-body time; wall also carries the package's one-time compile, charged to " +
      'whichever file reached a module first',
    lintNote:
      'ranked on rule time; wall also carries the TypeScript program build, charged to whichever ' +
      'file the parser reached first',
    browserNote: 'ranked on test-body time, which excludes browser and server startup',
    heading: 'SLOW TESTS FAILED THIS RUN',
    guidance:
      'Every file named under "slow files" is over its check\'s own-cost threshold — test-body ' +
      'time for jest and Playwright, rule time for lint. Fix the file, or raise ' +
      'slowFileThresholdStatics deliberately — a run is not green while these stand.',
  },
  openHandles: {
    heading: 'OPEN HANDLES FAILED THIS RUN',
    guidance:
      'Every handle named under "open handles" was still holding the event loop when its suite ' +
      'ended. Clear the timer, close the socket, or kill the child process it names.',
  },
} as const;
