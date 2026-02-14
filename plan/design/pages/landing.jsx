import React, { useState } from 'react';
import { Center, Group, Stack, Text, Box, TextInput, UnstyledButton } from '@mantine/core';
import { PixelSprite } from '../components/pixel-sprite.jsx';
import { fireballPixels } from '../sprites/fireball.jsx';
import { useTheme } from '../themes.jsx';

const logo = `
██████╗ ██╗   ██╗███╗   ██╗ ██████╗ ███████╗ ██████╗ ███╗   ██╗███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗
██╔══██╗██║   ██║████╗  ██║██╔════╝ ██╔════╝██╔═══██╗████╗  ██║████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██║  ██║██║   ██║██╔██╗ ██║██║  ███╗█████╗  ██║   ██║██╔██╗ ██║██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██║  ██║██║   ██║██║╚██╗██║██║   ██║██╔══╝  ██║   ██║██║╚██╗██║██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝╚██████╔╝██║ ╚████║╚██████╔╝███████╗╚██████╔╝██║ ╚████║██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
`.trimEnd();

// Fake data
const MOCK_PROJECTS = [
  { id: '1', name: 'codex-of-craft', path: '/home/user/codex-of-craft' },
  { id: '2', name: 'side-quest', path: '/home/user/side-quest' },
  { id: '3', name: 'empty-guild', path: '/home/user/empty-guild' },
];

const MOCK_QUESTS = {
  1: [
    { id: 'q1', title: 'Implement Auth Flow', status: 'complete' },
    { id: 'q2', title: 'Add Payment Processing', status: 'in_progress' },
    { id: 'q3', title: 'Refactor DB Layer', status: 'pending' },
  ],
  2: [{ id: 'q4', title: 'Setup CI Pipeline', status: 'pending' }],
};

const STATUS_MAP = {
  complete: 'success',
  in_progress: 'warning',
  pending: 'text-dim',
  failed: 'danger',
};

function PixelBtn({ label, onClick, theme, variant = 'primary', icon = false }) {
  const bg = variant === 'primary' ? theme.colors['primary'] : theme.colors['bg-raised'];
  const fg = variant === 'primary' ? theme.colors['bg-deep'] : theme.colors['text'];
  return (
    <UnstyledButton
      onClick={onClick}
      px={icon ? 8 : 'sm'}
      py={icon ? 0 : 4}
      style={{
        fontFamily: 'monospace',
        fontSize: icon ? 15 : 11,
        color: fg,
        backgroundColor: bg,
        border: `1px solid ${theme.colors['border']}`,
        borderRadius: 2,
      }}
    >
      {label}
    </UnstyledButton>
  );
}

function ProjectForm({ theme, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const inputStyles = {
    input: {
      backgroundColor: theme.colors['bg-deep'],
      borderColor: theme.colors['border'],
      color: theme.colors['text'],
      fontFamily: 'monospace',
      fontSize: 12,
    },
    label: { color: theme.colors['text-dim'], fontFamily: 'monospace', fontSize: 11 },
  };

  return (
    <Stack gap="sm" align="center">
      <Text ff="monospace" size="sm" style={{ color: theme.colors['primary'] }}>
        NEW GUILD
      </Text>
      <TextInput
        label="Name"
        placeholder="my-guild"
        value={name}
        onChange={(e) => setName(e.target.value)}
        w={260}
        styles={inputStyles}
      />
      <TextInput
        label="Path"
        placeholder="/home/user/my-guild"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        w={260}
        styles={inputStyles}
      />
      <Group gap="xs">
        <PixelBtn label="CREATE" theme={theme} onClick={() => onSave({ name, path })} />
        {onCancel && <PixelBtn label="CANCEL" theme={theme} variant="ghost" onClick={onCancel} />}
      </Group>
    </Stack>
  );
}

function MapFrame({ theme, children }) {
  const b = theme.colors['border'];
  const dim = theme.colors['text-dim'];
  return (
    <Box
      style={{
        border: `2px solid ${b}`,
        borderRadius: 2,
        padding: 16,
        position: 'relative',
        minHeight: 280,
        width: '100%',
        maxWidth: 740,
      }}
    >
      {/* Corner decorations */}
      <Text ff="monospace" size="xs" style={{ color: dim, position: 'absolute', top: -2, left: 8 }}>
        &#9484;&#9472;&#9472;
      </Text>
      <Text
        ff="monospace"
        size="xs"
        style={{ color: dim, position: 'absolute', top: -2, right: 8 }}
      >
        &#9472;&#9472;&#9488;
      </Text>
      <Text
        ff="monospace"
        size="xs"
        style={{ color: dim, position: 'absolute', bottom: -2, left: 8 }}
      >
        &#9492;&#9472;&#9472;
      </Text>
      <Text
        ff="monospace"
        size="xs"
        style={{ color: dim, position: 'absolute', bottom: -2, right: 8 }}
      >
        &#9472;&#9472;&#9496;
      </Text>
      {children}
    </Box>
  );
}

function ProjectList({ projects, selected, onSelect, onAdd, theme }) {
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
          GUILDS
        </Text>
        <PixelBtn label="+" onClick={onAdd} theme={theme} variant="ghost" icon />
      </Group>
      {projects.map((p) => (
        <UnstyledButton
          key={p.id}
          onClick={() => onSelect(p.id)}
          px="xs"
          py={3}
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: selected === p.id ? theme.colors['loot-gold'] : theme.colors['text'],
            backgroundColor: selected === p.id ? theme.colors['bg-raised'] : 'transparent',
            borderRadius: 2,
            borderLeft:
              selected === p.id
                ? `2px solid ${theme.colors['loot-gold']}`
                : '2px solid transparent',
          }}
        >
          {p.name}
        </UnstyledButton>
      ))}
    </Stack>
  );
}

function QuestList({ quests, theme, onSelect, onAdd }) {
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
          QUESTS
        </Text>
        <PixelBtn label="+" onClick={onAdd} theme={theme} variant="ghost" icon />
      </Group>
      {quests.length === 0 && (
        <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
          No quests yet
        </Text>
      )}
      {quests.map((q) => (
        <UnstyledButton
          key={q.id}
          onClick={() => onSelect(q.id)}
          px="xs"
          py={3}
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: theme.colors['text'],
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span>{q.title}</span>
          <span style={{ color: theme.colors[STATUS_MAP[q.status]], fontSize: 10 }}>
            {q.status.toUpperCase().replace('_', ' ')}
          </span>
        </UnstyledButton>
      ))}
    </Stack>
  );
}

export function LandingPage({ scenario = 'with-guilds', onNavigate }) {
  const { theme } = useTheme();
  const [view, setView] = useState('main'); // main | new-project | quest

  const scenarioData = {
    'with-guilds': { projects: MOCK_PROJECTS, selected: '1' },
    'no-guilds': { projects: [], selected: null },
    'empty-guild': { projects: MOCK_PROJECTS, selected: '3' },
  };
  const { projects: baseProjects, selected: baseSelected } =
    scenarioData[scenario] || scenarioData['with-guilds'];
  const [projects, setProjects] = useState(baseProjects);
  const [selectedProject, setSelectedProject] = useState(baseSelected);

  // Reset state when scenario changes
  React.useEffect(() => {
    const d = scenarioData[scenario] || scenarioData['with-guilds'];
    setProjects(d.projects);
    setSelectedProject(d.selected);
    setView('main');
  }, [scenario]);

  const quests = selectedProject ? MOCK_QUESTS[selectedProject] || [] : [];
  const hasProjects = projects.length > 0;

  return (
    <Center h="100vh">
      <Stack align="center" gap="md" w="100%" maw={800} px="md">
        {/* Logo */}
        <Group align="center" gap={40}>
          <PixelSprite pixels={fireballPixels} scale={4} width={12} height={12} />
          <pre
            style={{
              color: theme.colors['primary'],
              fontFamily: 'monospace',
              fontSize: '7px',
              lineHeight: 1.15,
              margin: 0,
              whiteSpace: 'pre',
            }}
          >
            {logo}
          </pre>
          <PixelSprite pixels={fireballPixels} scale={4} width={12} height={12} flip />
        </Group>

        {/* Map area */}
        <MapFrame theme={theme}>
          {/* New project form (no projects or clicked new project) */}
          {(!hasProjects || view === 'new-project') && (
            <Center h={250}>
              <ProjectForm
                theme={theme}
                onSave={(p) => {
                  const id = String(projects.length + 1);
                  setProjects([...projects, { ...p, id }]);
                  setSelectedProject(id);
                  setView('main');
                }}
                onCancel={hasProjects ? () => setView('main') : undefined}
              />
            </Center>
          )}

          {/* Main view: projects + quests */}
          {hasProjects && view === 'main' && (
            <Group align="flex-start" gap="xl" wrap="nowrap" style={{ minHeight: 200 }}>
              {/* Left: projects */}
              <Box
                style={{
                  flex: '0 0 200px',
                  borderRight: `1px solid ${theme.colors['border']}`,
                  paddingRight: 16,
                }}
              >
                <ProjectList
                  projects={projects}
                  selected={selectedProject}
                  onSelect={(id) => setSelectedProject(id)}
                  onAdd={() => setView('new-project')}
                  theme={theme}
                />
              </Box>

              {/* Right: quests */}
              <Box style={{ flex: 1 }}>
                {selectedProject ? (
                  <QuestList
                    quests={quests}
                    theme={theme}
                    onSelect={(id) => onNavigate?.('quest')}
                    onAdd={() => onNavigate?.('quest')}
                  />
                ) : (
                  <Center h={200}>
                    <Text ff="monospace" size="sm" style={{ color: theme.colors['text-dim'] }}>
                      Select a guild
                    </Text>
                  </Center>
                )}
              </Box>
            </Group>
          )}
        </MapFrame>
      </Stack>
    </Center>
  );
}
