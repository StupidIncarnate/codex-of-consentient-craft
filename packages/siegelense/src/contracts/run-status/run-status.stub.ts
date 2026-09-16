import type { z } from 'zod';

import { runStatusContract } from './run-status-contract';
import type { RunStatus } from './run-status-contract';

type RunStatusInput = z.input<typeof runStatusContract>;

export const RunStatusStub = ({ value }: { value?: RunStatusInput } = {}): RunStatus =>
  runStatusContract.parse(value ?? 'done');
