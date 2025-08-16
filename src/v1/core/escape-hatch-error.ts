import type { AgentReport } from '../models/agent';

export class EscapeHatchError extends Error {
  constructor(public escape: NonNullable<AgentReport['escape']>) {
    super(escape.reason);
    this.name = 'EscapeHatchError';
  }
}
