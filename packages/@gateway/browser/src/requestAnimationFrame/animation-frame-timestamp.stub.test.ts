import { AnimationFrameTimestampStub } from './animation-frame-timestamp.stub';

describe('AnimationFrameTimestampStub', () => {
  it('VALID: {} => resolves a real, non-negative timestamp', async () => {
    const timestamp = await AnimationFrameTimestampStub();

    expect(timestamp).toBeGreaterThanOrEqual(0);
  });
});
