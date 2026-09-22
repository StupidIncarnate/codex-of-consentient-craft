import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';
import { siegeAdversarialWalkerStatics } from './siege-adversarial-walker-statics';

describe('siege-adversarial-walker-statics', () => {
  it('VALID: measures strictly below maxVerbatimChars', () => {
    expect(Buffer.byteLength(siegeAdversarialWalkerStatics.prompt.template, 'utf8')).toBeLessThan(
      mcpToolResultStatics.maxVerbatimChars,
    );
  });
});
