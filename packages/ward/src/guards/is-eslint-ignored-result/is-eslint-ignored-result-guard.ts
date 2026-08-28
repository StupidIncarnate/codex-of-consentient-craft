/**
 * PURPOSE: Separates the entries ESLint emits for files it DECLINED to lint from the ones it
 * actually linted. Reach for this wherever an eslint result array is being counted rather than read
 * for findings: the array length answers "how many paths did eslint reply about", and this is what
 * turns that into "how many files did eslint check".
 *
 * USAGE:
 * isEslintIgnoredResultGuard({ entry: parsedEslintResults[0] });
 * // Returns: true for the "File ignored because of a matching ignore pattern" reply
 *
 * WHY IT EXISTS: an explicitly-passed path that the config ignores comes back as a FULL result entry
 * — same shape as a linted file, `errorCount: 0`, one ruleId-less severity-1 warning — so
 * `npm run ward -- --only lint -- packages/web/src/jest-dom.d.ts` reported `1 files passed` for a
 * file eslint never opened. Only an explicit path produces this; a directory walk skips ignored
 * files silently, which is why a whole-repo run never saw the miscount.
 *
 * IT KEYS ON THE MESSAGE PREFIX, not on `ruleId === null` alone, and not on the whole sentence.
 * ESLint spells several of these ("File ignored because of a matching ignore pattern", "File ignored
 * by default", "File ignored because outside of base path") and appends flag advice that has changed
 * between minors; `ruleId: null` on its own also covers parse errors and directive warnings, which
 * are findings about a file that WAS read.
 */

import { eslintJsonReportEntryContract } from '../../contracts/eslint-json-report-entry/eslint-json-report-entry-contract';

const IGNORED_MESSAGE_PREFIX = 'File ignored';

export const isEslintIgnoredResultGuard = ({ entry }: { entry?: unknown }): boolean => {
  const parsed = eslintJsonReportEntryContract.safeParse(entry);

  if (!parsed.success) {
    return false;
  }

  const { messages } = parsed.data;

  if (messages === undefined || messages.length !== 1) {
    return false;
  }

  const [message] = messages;

  if (message === undefined || message.ruleId !== null || message.message === undefined) {
    return false;
  }

  return String(message.message).startsWith(IGNORED_MESSAGE_PREFIX);
};
