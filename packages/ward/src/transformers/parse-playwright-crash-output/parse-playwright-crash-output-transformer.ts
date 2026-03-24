/**
 * PURPOSE: Parses Playwright line-reporter text output from a crash into structured TestFailure entries
 *
 * USAGE:
 * parsePlaywrightCrashOutputTransformer({ output: errorMessageContract.parse('  1) [chromium] › e2e/smoke.spec.ts:20:7 › Smoke › test\n\n    Error: timeout') });
 * // Returns TestFailure[] with suitePath, testName, message, and stackTrace
 */

import { errorMessageContract, type ErrorMessage } from '@dungeonmaster/shared/contracts';

import type { TestFailure } from '../../contracts/test-failure/test-failure-contract';
import { testFailureContract } from '../../contracts/test-failure/test-failure-contract';
import { stripAnsiCodesTransformer } from '../strip-ansi-codes/strip-ansi-codes-transformer';
import { stripTimeoutNoiseTransformer } from '../strip-timeout-noise/strip-timeout-noise-transformer';

const FAILURE_HEADER_PATTERN =
  /^\s*\d+\)\s+\[.*?\]\s+›\s+([\w/./-]+\.spec\.ts):(\d+):\d+\s+›\s+(.+?)\s*$/u;
const PROGRESS_LINE_PATTERN = /^\s*\[\d+\/\d+\]\s+\[/u;
const ATTACHMENT_LINE_PATTERN = /^\s+attachment\s+#/u;
const NETWORK_LOG_ATTACHMENT_PATTERN = /^\s+attachment\s+#\d+\s+network-log/u;
const RETRY_HEADER_PATTERN = /^\s+Retry\s+#\d+\s+─/u;

export const parsePlaywrightCrashOutputTransformer = ({
  output,
}: {
  output: ErrorMessage;
}): TestFailure[] => {
  const clean = stripAnsiCodesTransformer({ text: output });
  const lines = clean.split('\n');
  const failures: TestFailure[] = [];

  let i = 0;
  while (i < lines.length) {
    const headerMatch = FAILURE_HEADER_PATTERN.exec(lines[i] ?? '');
    if (!headerMatch) {
      i++;
      continue;
    }

    const [, filePath, , testNameRaw] = headerMatch;
    const suitePath = errorMessageContract.parse(filePath ?? '');
    const testName = errorMessageContract.parse((testNameRaw ?? '').trim());

    i++;

    const errorLines: ErrorMessage[] = [];
    const stackLines: ErrorMessage[] = [];
    const networkLogLines: ErrorMessage[] = [];
    let inAttachmentOrRetry = false;
    let inNetworkLog = false;

    while (i < lines.length) {
      const line = lines[i] ?? '';

      if (FAILURE_HEADER_PATTERN.test(line) || PROGRESS_LINE_PATTERN.test(line)) {
        break;
      }

      if (line.startsWith('[WebServer]')) {
        i++;
        continue;
      }

      if (NETWORK_LOG_ATTACHMENT_PATTERN.test(line)) {
        inNetworkLog = true;
        inAttachmentOrRetry = false;
        i++;
        continue;
      }

      if (ATTACHMENT_LINE_PATTERN.test(line) || RETRY_HEADER_PATTERN.test(line)) {
        inAttachmentOrRetry = true;
        inNetworkLog = false;
        i++;
        continue;
      }

      if (inNetworkLog) {
        const trimmed = line.trimStart();
        if (trimmed.length > 0) {
          networkLogLines.push(errorMessageContract.parse(trimmed));
        }
        i++;
        continue;
      }

      if (inAttachmentOrRetry) {
        i++;
        continue;
      }

      const trimmed = line.trimStart();
      if (trimmed.startsWith('at ') || trimmed.startsWith('at /')) {
        stackLines.push(errorMessageContract.parse(line));
      } else if (trimmed.length > 0) {
        errorLines.push(errorMessageContract.parse(line));
      }

      i++;
    }

    const rawMessage = errorLines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    const strippedMessage = stripTimeoutNoiseTransformer({
      message: errorMessageContract.parse(rawMessage),
    });

    const networkLog = networkLogLines.join('\n');
    const message = networkLog.length > 0 ? `${strippedMessage}\n\n${networkLog}` : strippedMessage;

    const stackTrace = stackLines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    if (message.length > 0) {
      failures.push(
        testFailureContract.parse({
          suitePath,
          testName,
          message,
          ...(stackTrace.length > 0 ? { stackTrace } : {}),
        }),
      );
    }
  }

  return failures;
};
