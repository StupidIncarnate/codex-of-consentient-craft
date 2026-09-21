import type { StubArgument } from '@dungeonmaster/shared/@types';

import { wardDetailContract } from './ward-detail-contract';
import type { WardDetail } from './ward-detail-contract';

export const WardDetailStub = ({ ...props }: StubArgument<WardDetail> = {}): WardDetail =>
  wardDetailContract.parse({
    checks: [
      {
        checkType: 'lint',
        projectResults: [
          {
            errors: [
              {
                filePath: 'packages/web/src/index.ts',
                message: 'Unexpected any',
                line: 10,
                rule: '@typescript-eslint/no-explicit-any',
              },
            ],
            testFailures: [],
          },
        ],
      },
    ],
    ...props,
  });
