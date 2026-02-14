import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, Group, Select, UnstyledButton } from '@mantine/core';
import '@mantine/core/styles.css';
import { ThemeProvider, useTheme, schemes } from './themes.jsx';
import { LandingPage } from './pages/landing.jsx';
import { ColorSchemePage } from './pages/color-scheme.jsx';
import { QuestDetailPage } from './pages/quest-detail.jsx';

const pages = [
  { id: 'landing', label: 'App' },
  { id: 'quest', label: 'Quest' },
  { id: 'colors', label: 'Design' },
];

const scenarios = {
  landing: [
    { value: 'with-guilds', label: 'With Guilds' },
    { value: 'no-guilds', label: 'No Guilds' },
    { value: 'empty-guild', label: 'Empty Guild' },
  ],
  quest: [
    { value: 'chat', label: 'Chat' },
    { value: 'clarify', label: 'Clarify' },
    { value: 'req-approve', label: 'Req Approve' },
    { value: 'req-edit', label: 'Req Editing' },
    { value: 'obs-approve', label: 'Obs Approve' },
    { value: 'obs-edit', label: 'Obs Editing' },
    { value: 'design-proto', label: 'Design Proto' },
  ],
  colors: [],
};

const themeOptions = Object.entries(schemes).map(([id, s]) => ({ value: id, label: s.name }));

function Shell() {
  const [page, setPage] = useState('landing');
  const [scenario, setScenario] = useState(() => scenarios['landing']?.[0]?.value || 'default');
  const { themeId, setThemeId, theme } = useTheme();
  const pageScenarios = scenarios[page] || [];

  return (
    <>
      <Group
        justify="space-between"
        p="xs"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: theme.colors['bg-deep'],
          borderBottom: `1px solid ${theme.colors['border']}`,
        }}
      >
        <Group gap="xs">
          {pages.map((p) => (
            <UnstyledButton
              key={p.id}
              onClick={() => {
                setPage(p.id);
                setScenario(scenarios[p.id]?.[0]?.value || 'default');
              }}
              px="sm"
              py={4}
              style={{
                color: page === p.id ? theme.colors['loot-gold'] : theme.colors['text-dim'],
                fontFamily: 'monospace',
                fontSize: 12,
                borderBottom:
                  page === p.id
                    ? `2px solid ${theme.colors['loot-gold']}`
                    : '2px solid transparent',
              }}
            >
              {p.label}
            </UnstyledButton>
          ))}
        </Group>
        <Group gap="xs">
          {pageScenarios.length > 0 && (
            <Select
              data={pageScenarios}
              value={scenario}
              onChange={setScenario}
              size="xs"
              w={140}
              styles={{
                input: {
                  backgroundColor: theme.colors['bg-surface'],
                  borderColor: theme.colors['border'],
                  color: theme.colors['loot-gold'],
                  fontFamily: 'monospace',
                  fontSize: 11,
                },
              }}
            />
          )}
          <Select
            data={themeOptions}
            value={themeId}
            onChange={setThemeId}
            size="xs"
            w={160}
            styles={{
              input: {
                backgroundColor: theme.colors['bg-surface'],
                borderColor: theme.colors['border'],
                color: theme.colors['text'],
                fontFamily: 'monospace',
                fontSize: 11,
              },
            }}
          />
        </Group>
      </Group>

      <div style={{ background: theme.colors['bg-deep'], minHeight: '100vh' }}>
        {page === 'landing' && (
          <LandingPage
            scenario={scenario}
            onNavigate={(p) => {
              setPage(p);
              setScenario(scenarios[p]?.[0]?.value || 'default');
            }}
          />
        )}
        {page === 'quest' && (
          <QuestDetailPage scenario={scenario} onBack={() => setPage('landing')} />
        )}
        {page === 'colors' && <ColorSchemePage />}
      </div>
    </>
  );
}

function App() {
  return (
    <MantineProvider defaultColorScheme="dark">
      <ThemeProvider>
        <Shell />
      </ThemeProvider>
    </MantineProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
