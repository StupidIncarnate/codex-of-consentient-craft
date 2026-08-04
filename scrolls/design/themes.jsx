import React, { createContext, useContext, useState } from 'react';

export const schemes = {
  catacombs: {
    name: 'Catacombs',
    desc: 'Deep stone dungeon. Cold, ancient, torchlit.',
    colors: {
      'bg-deep': '#0a0a12',
      'bg-surface': '#14141f',
      'bg-raised': '#1e1e2e',
      border: '#2a2a3a',
      text: '#c8c8d4',
      'text-dim': '#6a6a80',
      primary: '#7b68ee',
      success: '#50c878',
      warning: '#daa520',
      danger: '#dc3545',
      'loot-gold': '#ffd700',
      'loot-rare': '#a855f7',
    },
  },
  ember: {
    name: 'Ember Depths',
    desc: 'Volcanic forge. Molten, warm, smoldering.',
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
  },
  abyssal: {
    name: 'Abyssal Keep',
    desc: 'Deep ocean fortress. Cold blue, bioluminescent.',
    colors: {
      'bg-deep': '#060a14',
      'bg-surface': '#0c1524',
      'bg-raised': '#132035',
      border: '#1e3050',
      text: '#b8cce0',
      'text-dim': '#5a7090',
      primary: '#38bdf8',
      success: '#2dd4bf',
      warning: '#f59e0b',
      danger: '#fb7185',
      'loot-gold': '#fcd34d',
      'loot-rare': '#a78bfa',
    },
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('ember');
  const theme = schemes[themeId];
  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, theme, schemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
