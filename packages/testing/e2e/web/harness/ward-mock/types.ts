import type { DelayMilliseconds } from '../../../../src/contracts/delay-milliseconds/delay-milliseconds-contract';

export interface WardResponse {
  exitCode?: number;
  runId?: string;
  outputLines?: string[];
  wardResultJson?: Record<string, unknown>;
  delayMs?: DelayMilliseconds;
}
