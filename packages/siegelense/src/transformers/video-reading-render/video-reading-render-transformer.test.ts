import { VideoResultStub } from '../../contracts/video-result/video-result.stub';
import { videoReadingRenderTransformer } from './video-reading-render-transformer';

describe('videoReadingRenderTransformer', () => {
  it('VALID: {result: {status: "started", path: null}} => returns video recording started', () => {
    const result = videoReadingRenderTransformer({
      result: VideoResultStub({ status: 'started', path: null }),
    });

    expect(result).toBe('video recording started');
  });

  it('VALID: {result: {status: "stopped", path: "/tmp/walk.webm"}} => returns video recording stopped with path', () => {
    const result = videoReadingRenderTransformer({
      result: VideoResultStub({
        status: 'stopped',
        path: '/tmp/walk.webm',
      }),
    });

    expect(result).toBe('video recording stopped — saved to /tmp/walk.webm');
  });

  it('VALID: {result: {status: "stopped", path: null}} => falls back to evidence/video when path is null', () => {
    const result = videoReadingRenderTransformer({
      result: VideoResultStub({
        status: 'stopped',
        path: null,
      }),
    });

    expect(result).toBe('video recording stopped — saved to evidence/video');
  });
});
