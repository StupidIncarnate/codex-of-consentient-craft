import { uploadPercentTransformer } from './upload-percent-transformer';

describe('uploadPercentTransformer', () => {
  describe('zero total', () => {
    it('EMPTY: {bytesTotal: 0} => returns 0', () => {
      const result = uploadPercentTransformer({
        bytesSent: 512,
        bytesTotal: 0,
      });

      expect(result).toBe(0);
    });
  });

  describe('valid progress', () => {
    it('VALID: {bytesSent: 512, bytesTotal: 1024} => returns 50', () => {
      const result = uploadPercentTransformer({
        bytesSent: 512,
        bytesTotal: 1024,
      });

      expect(result).toBe(50);
    });

    it('VALID: {bytesSent: 1024, bytesTotal: 1024} => returns 100', () => {
      const result = uploadPercentTransformer({
        bytesSent: 1024,
        bytesTotal: 1024,
      });

      expect(result).toBe(100);
    });
  });

  describe('overshoot', () => {
    it('EDGE: {bytesSent: 2048, bytesTotal: 1024} => returns 100 (clamped, not 200)', () => {
      const result = uploadPercentTransformer({
        bytesSent: 2048,
        bytesTotal: 1024,
      });

      expect(result).toBe(100);
    });
  });

  describe('rounding', () => {
    it('EDGE: {bytesSent: 1, bytesTotal: 3} => returns 33', () => {
      const result = uploadPercentTransformer({
        bytesSent: 1,
        bytesTotal: 3,
      });

      expect(result).toBe(33);
    });

    it('EDGE: {bytesSent: 2, bytesTotal: 3} => returns 67', () => {
      const result = uploadPercentTransformer({
        bytesSent: 2,
        bytesTotal: 3,
      });

      expect(result).toBe(67);
    });
  });

  describe('zero sent', () => {
    it('EMPTY: {bytesSent: 0, bytesTotal: 1024} => returns 0', () => {
      const result = uploadPercentTransformer({
        bytesSent: 0,
        bytesTotal: 1024,
      });

      expect(result).toBe(0);
    });
  });
});
