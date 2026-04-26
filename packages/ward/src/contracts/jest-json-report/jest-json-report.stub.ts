import type { StubArgument } from '@dungeonmaster/shared/@types';
import { jestJsonReportContract, type JestJsonReport } from './jest-json-report-contract';

export const JestJsonReportStub = ({
  ...props
}: StubArgument<JestJsonReport> = {}): JestJsonReport =>
  jestJsonReportContract.parse({
    numTotalTestSuites: 1,
    numPassedTests: 2,
    testResults: [
      {
        name: '/repo/packages/example/src/foo.test.ts',
        status: 'passed',
        startTime: 1700000000000,
        endTime: 1700000000050,
        assertionResults: [
          {
            status: 'passed',
            fullName: 'foo > does the thing',
            duration: 12,
            failureMessages: [],
          },
        ],
      },
    ],
    ...props,
  });
