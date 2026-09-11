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
    // One note per runner. A test-running check is judged on its WORST SINGLE TEST, so its note
    // says to look there and gives the suite total beside it as context — a total alone cannot
    // tell a file holding one slow test from a file holding many cheap ones. Lint runs no tests,
    // so it keeps a wall comparison, and what its wall carries is the TypeScript program build.
    jestNote:
      'ranked on the slowest single test; the suite total and test count follow it, so a big file ' +
      'reads differently from a slow one',
    lintNote:
      'ranked on rule time; wall also carries the TypeScript program build, charged to whichever ' +
      'file the parser reached first',
    browserNote:
      'ranked on the slowest single test, which excludes browser and server startup; the spec ' +
      'total and test count follow it',
    heading: 'SLOW TESTS FAILED THIS RUN',
    guidance:
      'Every file named under "slow files" holds a test over its check\'s threshold — the slowest ' +
      'single test for jest and Playwright, rule time for lint. Fix that test, or raise ' +
      'slowFileThresholdStatics deliberately — a run is not green while these stand.',
  },
  openHandles: {
    heading: 'OPEN HANDLES FAILED THIS RUN',
    guidance:
      'Every handle named under "open handles" was still holding the event loop when its suite ' +
      'ended. Clear the timer, close the socket, or kill the child process it names.',
  },
} as const;
