import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { SettleReadingStub } from '../../contracts/settle-reading/settle-reading.stub';
import { settleReadingRenderTransformer } from './settle-reading-render-transformer';

describe('settleReadingRenderTransformer', () => {
  describe('settled: true', () => {
    it('VALID: {baseMessage, settled: true} => returns baseMessage unchanged', () => {
      const baseMessage = ContentTextStub({ value: 'clicked [data-testid="PIXEL_BTN"]' });
      const settleReading = SettleReadingStub({ settled: true, reason: 'quiet', waitedMs: 120 });

      const result = settleReadingRenderTransformer({ baseMessage, settleReading });

      expect(result).toBe('clicked [data-testid="PIXEL_BTN"]');
    });
  });

  describe('settled: false', () => {
    it('VALID: {baseMessage, settled: false, one unsettled signal} => appends the reason, wait time and signal', () => {
      const baseMessage = ContentTextStub({ value: 'clicked [data-testid="SLOW_BTN"]' });
      const settleReading = SettleReadingStub({
        settled: false,
        reason: 'ceiling',
        waitedMs: 5000,
        unsettled: ['network'],
        pendingRequests: 1,
      });

      const result = settleReadingRenderTransformer({ baseMessage, settleReading });

      expect(result).toBe(
        'clicked [data-testid="SLOW_BTN"]; did not settle after 5000ms (still moving: network)',
      );
    });

    it('VALID: {baseMessage, settled: false, several unsettled signals} => joins every still-moving signal with a comma', () => {
      const baseMessage = ContentTextStub({ value: 'typed "x" into [data-testid="NAME_INPUT"]' });
      const settleReading = SettleReadingStub({
        settled: false,
        reason: 'ceiling',
        waitedMs: 5000,
        unsettled: ['network', 'dom', 'animation'],
        pendingRequests: 2,
      });

      const result = settleReadingRenderTransformer({ baseMessage, settleReading });

      expect(result).toBe(
        'typed "x" into [data-testid="NAME_INPUT"]; did not settle after 5000ms (still moving: network, dom, animation)',
      );
    });
  });
});
