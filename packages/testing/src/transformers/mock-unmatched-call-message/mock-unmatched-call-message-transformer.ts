/**
 * PURPOSE: Builds the error message thrown when a call to a mocked function matches no staged description
 *
 * USAGE:
 * mockUnmatchedCallMessageTransformer({ name, args: ['/a/other.json'], staged });
 * // Returns 'registerMock: nothing set up for the call NAME("/a/other.json"). Calls that ARE set up: ("/a/quest.json")'
 */


import type { StagedCall } from '../../contracts/staged-call/staged-call-contract';

export const mockUnmatchedCallMessageTransformer = ({
  name,
  args,
  staged,
}: {
  name: string;
  args: readonly unknown[];
  staged: StagedCall[];
}): string =>
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
    ].join('');
