import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  playwrightJsonReportContract,
  type PlaywrightJsonReport,
} from './playwright-json-report-contract';

export const PlaywrightJsonReportStub = ({
  ...props
}: StubArgument<PlaywrightJsonReport> = {}): PlaywrightJsonReport =>
  playwrightJsonReportContract.parse({
    suites: [
      {
        title: 'root',
        specs: [
          {
            title: 'renders the dashboard',
            file: 'tests/dashboard.e2e.test.ts',
            tests: [
              {
                results: [{ status: 'passed', duration: 200 }],
              },
            ],
          },
        ],
        suites: [
          {
            title: 'nested',
            specs: [],
          },
        ],
      },
    ],
    ...props,
  });
