import { riftcarverDetailContract } from './riftcarver-detail-contract';
import { RiftcarverDetailStub } from './riftcarver-detail.stub';

describe('riftcarverDetailContract', () => {
  describe('valid input', () => {
    it('VALID: {log: multi-line carve log} => parses and exposes log verbatim', () => {
      const detail = RiftcarverDetailStub({ log: 'line one\nline two\n' });

      const result = riftcarverDetailContract.parse(detail);

      expect(result.log).toBe('line one\nline two\n');
    });

    it('EMPTY: {log: empty string} => parses to empty log', () => {
      const result = riftcarverDetailContract.parse({ log: '' });

      expect(result.log).toBe('');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {missing log} => throws', () => {
      expect(() => riftcarverDetailContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {log: number} => throws', () => {
      expect(() => riftcarverDetailContract.parse({ log: 123 as never })).toThrow(
        /Expected string/u,
      );
    });
  });
});
