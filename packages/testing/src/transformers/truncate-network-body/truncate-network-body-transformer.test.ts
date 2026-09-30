
import { truncateNetworkBodyTransformer } from './truncate-network-body-transformer';

describe('truncateNetworkBodyTransformer', () => {
  describe('short bodies', () => {
    it('VALID: {body: short string} => returns unchanged', () => {
      const body = '{"id":"abc"}';

      const result = truncateNetworkBodyTransformer({ body });

      expect(result).toBe('{"id":"abc"}');
    });

    it('VALID: {body: empty string} => returns empty', () => {
      const body = '';

      const result = truncateNetworkBodyTransformer({ body });

      expect(result).toBe('');
    });

    it('VALID: {body: exactly maxBodyLength} => returns unchanged', () => {
      const body = 'x'.repeat(1500);

      const result = truncateNetworkBodyTransformer({ body });

      expect(result).toBe('x'.repeat(1500));
    });
  });

  describe('long bodies', () => {
    it('VALID: {body: exceeds maxBodyLength} => returns truncated with ellipsis', () => {
      const body = 'x'.repeat(1501);

      const result = truncateNetworkBodyTransformer({ body });

      expect(result).toBe(`${'x'.repeat(1500)}...`);
    });

    it('VALID: {body: much longer than max} => truncates to maxBodyLength plus ellipsis', () => {
      const body = 'y'.repeat(3000);

      const result = truncateNetworkBodyTransformer({ body });

      expect(result).toBe(`${'y'.repeat(1500)}...`);
    });
  });
});
