import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';
import { flowriderWorkerStatics } from './flowrider-worker-statics';

describe('flowriderWorkerStatics', () => {
  it('VALID: served template => measures below the byte ceiling', () => {
    // The budget ceiling is 50,000 bytes
    const totalLength = Buffer.byteLength(flowriderWorkerStatics.prompt.template, 'utf8');

    expect(totalLength).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });
});
