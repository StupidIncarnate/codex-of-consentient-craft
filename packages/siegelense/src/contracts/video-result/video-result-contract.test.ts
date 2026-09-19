import { videoResultContract } from './video-result-contract';
import { VideoResultStub } from './video-result.stub';

describe('videoResultContract', () => {
  describe('valid members', () => {
    it('VALID: {status: "started", path: null} => parses to VideoResult', () => {
      const stub = VideoResultStub({ status: 'started', path: null });

      const result = videoResultContract.parse(stub);

      expect(result).toStrictEqual({ status: 'started', path: null });
    });

    it('VALID: {status: "stopped", path: "/path/to/video.webm"} => parses to VideoResult', () => {
      const stub = VideoResultStub({
        status: 'stopped',
        path: '/path/to/video.webm',
      });

      const result = videoResultContract.parse(stub);

      expect(result).toStrictEqual({
        status: 'stopped',
        path: '/path/to/video.webm',
      });
    });
  });

  describe('invalid members', () => {
    it('INVALID: {status: 123} => non-string status throws validation error', () => {
      expect(() => {
        videoResultContract.parse({ status: 123, path: null });
      }).toThrow(/Expected string/u);
    });

    it('INVALID: {path: 123} => non-string non-null path throws validation error', () => {
      expect(() => {
        videoResultContract.parse({ status: 'stopped', path: 123 });
      }).toThrow(/Expected string/u);
    });

    it('INVALID: {extra: "field"} => extra property throws due to strict mode', () => {
      expect(() => {
        videoResultContract.parse({ status: 'started', path: null, extra: 'field' });
      }).toThrow(/Unrecognized key/u);
    });
  });
});
