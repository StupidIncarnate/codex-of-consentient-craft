import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';
import { siegeAdversarialFixerStatics } from './siege-adversarial-fixer-statics';

describe('siege-adversarial-fixer-statics', () => {
  it('VALID: measures strictly below maxVerbatimChars', () => {
    expect(Buffer.byteLength(siegeAdversarialFixerStatics.prompt.template, 'utf8')).toBeLessThan(
      mcpToolResultStatics.maxVerbatimChars,
    );
  });
});
