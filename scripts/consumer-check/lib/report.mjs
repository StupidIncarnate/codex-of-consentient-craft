/**
 * A tiny assertion/report accumulator. Not Jest: this suite runs OUTSIDE ward (see this file's own
 * `run.mjs` header for why), against real subprocesses and a real `/tmp` consumer, so it prints a
 * plain pass/fail line per named assertion rather than going through a test runner.
 */

export const createReport = ({ sectionName }) => {
  const results = [];

  return {
    sectionName,
    check: (name, pass, detail) => {
      results.push({ name, pass, detail: detail ?? '' });
      const marker = pass ? 'PASS' : 'FAIL';
      process.stdout.write(`  [${marker}] ${name}${detail ? ` — ${detail}` : ''}\n`);
    },
    results: () => results,
    allPassed: () => results.every((result) => result.pass),
  };
};

export const printSummary = (sections) => {
  process.stdout.write('\n=== consumer-check summary ===\n');
  let totalPass = 0;
  let totalFail = 0;
  for (const section of sections) {
    const results = section.results();
    const pass = results.filter((result) => result.pass).length;
    const fail = results.length - pass;
    totalPass += pass;
    totalFail += fail;
    process.stdout.write(`${section.sectionName}: ${String(pass)} passed, ${String(fail)} failed\n`);
    for (const result of results.filter((entry) => !entry.pass)) {
      process.stdout.write(`  FAIL: ${result.name}${result.detail ? ` — ${result.detail}` : ''}\n`);
    }
  }
  process.stdout.write(`TOTAL: ${String(totalPass)} passed, ${String(totalFail)} failed\n`);
  return totalFail === 0;
};
