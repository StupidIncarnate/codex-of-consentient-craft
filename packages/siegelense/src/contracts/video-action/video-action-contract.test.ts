import { videoStatics } from '../../statics/video/video-statics';
import { videoActionContract } from './video-action-contract';
import { VideoActionStub } from './video-action.stub';

describe('videoActionContract', () => {
  describe('valid members', () => {
    it.each(videoStatics.actions)('VALID: {value: %s} => parses to itself', (value) => {
      const action = VideoActionStub({ value });

      const result = videoActionContract.parse(action);

      expect(result).toBe(value);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "pause"} => an unlisted string throws validation error', () => {
      expect(() => {
        VideoActionStub({ value: 'pause' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "START"} => an uppercase variant of a valid member throws validation error', () => {
      expect(() => {
        videoActionContract.parse('START');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
