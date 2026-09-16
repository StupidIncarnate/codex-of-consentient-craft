import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resultWhereContract } from './result-where-contract';
import type { ResultWhere } from './result-where-contract';

export const ResultWhereStub = ({ ...props }: StubArgument<ResultWhere> = {}): ResultWhere =>
  resultWhereContract.parse({
    path: null,
    method: null,
    nth: null,
    level: null,
    steps: null,
    ...props,
  });
