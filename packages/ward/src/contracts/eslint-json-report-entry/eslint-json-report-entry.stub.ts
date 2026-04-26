import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  eslintJsonReportEntryContract,
  type EslintJsonReportEntry,
} from './eslint-json-report-entry-contract';

export const EslintJsonReportEntryStub = ({
  ...props
}: StubArgument<EslintJsonReportEntry> = {}): EslintJsonReportEntry =>
  eslintJsonReportEntryContract.parse({
    filePath: '/repo/packages/example/src/index.ts',
    messages: [
      {
        ruleId: 'no-any',
        severity: 2,
        message: 'Unexpected any',
        line: 10,
        column: 5,
      },
    ],
    stats: {
      times: {
        passes: [{ total: 12.5 }],
      },
    },
    ...props,
  });
