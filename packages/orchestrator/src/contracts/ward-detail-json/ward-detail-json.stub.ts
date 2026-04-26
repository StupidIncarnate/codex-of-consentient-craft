import type { StubArgument } from '@dungeonmaster/shared/@types';

import { wardDetailJsonContract } from './ward-detail-json-contract';
import type { WardDetailJson } from './ward-detail-json-contract';

/**
 * Default ward detail — one check, one project, one error and one test failure.
 * Tests override `checks` to construct empty/multi-error/multi-failure variants.
 */
export const WardDetailJsonStub = ({
  ...props
}: StubArgument<WardDetailJson> = {}): WardDetailJson =>
  wardDetailJsonContract.parse({
    checks: [
      {
        projectResults: [
          {
            errors: [
              {
                filePath: '/abs/path/file.ts',
                message: 'something is wrong',
                line: 10,
                column: 5,
                rule: 'some-rule',
              },
            ],
            testFailures: [],
          },
        ],
      },
    ],
    ...props,
  });
