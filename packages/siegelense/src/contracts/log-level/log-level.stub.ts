import type { z } from '#gateway/npm/zod';

import { logLevelContract } from './log-level-contract';
import type { LogLevel } from './log-level-contract';

type LogLevelInput = z.input<typeof logLevelContract>;

export const LogLevelStub = ({ value }: { value?: LogLevelInput } = {}): LogLevel =>
  logLevelContract.parse(value ?? 'error');
