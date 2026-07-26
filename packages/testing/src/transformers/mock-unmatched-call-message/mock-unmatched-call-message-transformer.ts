/**
 * PURPOSE: Builds the error message thrown when a call to a mocked function matches no staged description
 *
 * USAGE:
 * mockUnmatchedCallMessageTransformer({ name, args: ['/a/other.json'], staged });
 * // Returns 'registerMock: nothing set up for the call NAME("/a/other.json"). Calls that ARE set up: ("/a/quest.json")'
 */

import { errorMessageContract, type ErrorMessage } from '@dungeonmaster/shared/contracts';

import type { MockFunctionName } from '../../contracts/mock-function-name/mock-function-name-contract';
import type { StagedCall } from '../../contracts/staged-call/staged-call-contract';

export const mockUnmatchedCallMessageTransformer = ({
  name,
  args,
  staged,
}: {
  name: MockFunctionName;
  args: readonly unknown[];
  staged: StagedCall[];
}): ErrorMessage =>
  errorMessageContract.parse(
    [
      `registerMock: nothing set up for the call ${name}(`,
      args
        .map((value) => (typeof value === 'function' ? '<predicate>' : JSON.stringify(value)))
        .join(', '),
      '). Calls that ARE set up: ',
      staged
        .map(
          (entry) =>
            `(${entry.args
              .map((value) => (typeof value === 'function' ? '<predicate>' : JSON.stringify(value)))
              .join(', ')})`,
        )
        .join(' | '),
    ].join(''),
  );
