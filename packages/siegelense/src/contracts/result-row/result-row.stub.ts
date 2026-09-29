import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resultRowContract } from './result-row-contract';
import type { ResultRow } from './result-row-contract';

export const ResultRowStub = ({ ...props }: StubArgument<ResultRow> = {}): ResultRow =>
  resultRowContract.parse({ status: 200, ...props });
