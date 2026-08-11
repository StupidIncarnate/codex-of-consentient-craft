import { emberDepthsThemeStatics } from '../ember-depths-theme/ember-depths-theme-statics';
import { packageTypeStyleStatics } from './package-type-style-statics';

const { colors } = emberDepthsThemeStatics;

describe('packageTypeStyleStatics', () => {
  // Asserted whole, so a package kind added to the shared enum without a colour here fails rather
  // than falling through to an undefined chip colour at paint time. The expected map is also where
  // the tiering is legible: the two e2e-eligible kinds share one token (so a repo with three UI
  // packages reads the same as one with one), the three wire-answering kinds share another, and
  // `unresolved` is deliberately outside every tier.
  it('VALID: {packageTypeStyleStatics} => every package kind maps to a palette token, tiered by what runs it', () => {
    expect(packageTypeStyleStatics).toStrictEqual({
      accent: {
        'frontend-react': colors.primary,
        'frontend-ink': colors.primary,
        'http-backend': colors.success,
        'mcp-server': colors.success,
        'programmatic-service': colors.success,
        'cli-tool': colors['loot-gold'],
        'hook-handlers': colors['loot-gold'],
        'eslint-plugin': colors['loot-gold'],
        library: colors['text-dim'],
      },
      unresolved: colors.danger,
    });
  });
});
