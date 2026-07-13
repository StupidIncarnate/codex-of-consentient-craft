import { emberDepthsThemeStatics } from './ember-depths-theme-statics';

describe('emberDepthsThemeStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(emberDepthsThemeStatics).toStrictEqual({
      colors: {
        'bg-deep': '#0d0907',
        'bg-surface': '#1a110d',
        'bg-raised': '#2a1a14',
        border: '#3d2a1e',
        text: '#e0cfc0',
        'text-dim': '#8a7260',
        primary: '#ff6b35',
        success: '#4ade80',
        warning: '#f59e0b',
        danger: '#ef4444',
        'loot-gold': '#fbbf24',
        'loot-rare': '#e879f9',
      },
      typography: {
        font: 'monospace',
      },
    });
  });
});
