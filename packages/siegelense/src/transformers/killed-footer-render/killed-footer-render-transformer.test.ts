import { killedFooterRenderTransformer } from './killed-footer-render-transformer';

describe('killedFooterRenderTransformer', () => {
  describe('exactly one killed row', () => {
    it('VALID: {killedCount: 1} => "1 killed" reads with the singular "tombstone"', () => {
      const result = killedFooterRenderTransformer({ killedCount: 1 });

      expect(result).toBe(
        '1 killed — tombstone, not leaks: no process, no port, no memory. The row and its evidence\n' +
          'are kept so `results` and `status` still answer for a dead instance, which is the normal\n' +
          'case for anyone reading a run that broke. No built call removes them; that is `prune`.\n',
      );
    });
  });

  describe('more than one killed row', () => {
    it('VALID: {killedCount: 3} => "3 killed" reads with the plural "tombstones"', () => {
      const result = killedFooterRenderTransformer({ killedCount: 3 });

      expect(result).toBe(
        '3 killed — tombstones, not leaks: no process, no port, no memory. The row and its evidence\n' +
          'are kept so `results` and `status` still answer for a dead instance, which is the normal\n' +
          'case for anyone reading a run that broke. No built call removes them; that is `prune`.\n',
      );
    });
  });
});
