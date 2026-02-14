import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ThemeSchemeDescriptionStub } from '../theme-scheme-description/theme-scheme-description.stub';
import { ThemeSchemeNameStub } from '../theme-scheme-name/theme-scheme-name.stub';

import { themeSchemeContract } from './theme-scheme-contract';
import type { ThemeScheme } from './theme-scheme-contract';

export const ThemeSchemeStub = ({ ...props }: StubArgument<ThemeScheme> = {}): ThemeScheme =>
  themeSchemeContract.parse({
    name: ThemeSchemeNameStub(),
    desc: ThemeSchemeDescriptionStub(),
    colors: {
      'bg-deep': '#1a0a2e',
      'bg-surface': '#2d1b4e',
      'bg-raised': '#3d2b5e',
      border: '#4a3866',
      text: '#e8e0f0',
      'text-dim': '#8b7fa8',
      primary: '#ff4500',
      success: '#00c853',
      warning: '#ffd600',
      danger: '#ff1744',
      'loot-gold': '#ffd700',
      'loot-rare': '#bb86fc',
    },
    ...props,
  });
