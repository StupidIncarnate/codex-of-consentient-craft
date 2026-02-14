import React from 'react';
import { Stack, Text, Group, Box, SimpleGrid } from '@mantine/core';
import { useTheme } from '../themes.jsx';

function Swatch({ color, label, theme }) {
  return (
    <Group gap={8} align="center">
      <Box
        style={{
          width: 32,
          height: 32,
          backgroundColor: color,
          border: `1px solid ${theme.colors['border']}`,
          borderRadius: 2,
        }}
      />
      <Stack gap={0}>
        <Text size="xs" ff="monospace" style={{ color: theme.colors['text-dim'] }}>
          {label}
        </Text>
        <Text size="xs" ff="monospace" style={{ color: theme.colors['text'] }}>
          {color}
        </Text>
      </Stack>
    </Group>
  );
}

export function ColorSchemePage() {
  const { theme } = useTheme();

  return (
    <Box p="xl" pt={60} maw={1000} mx="auto">
      <Text size="lg" fw={700} mb="xs" ff="monospace" style={{ color: theme.colors['primary'] }}>
        {theme.name}
      </Text>
      <Text size="sm" mb="xl" style={{ color: theme.colors['text-dim'] }}>
        {theme.desc}
      </Text>

      {/* Sample UI bar */}
      <Box
        p="sm"
        mb="xl"
        style={{
          backgroundColor: theme.colors['bg-surface'],
          border: `1px solid ${theme.colors['border']}`,
          borderRadius: 4,
        }}
      >
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={600} style={{ color: theme.colors['text'] }}>
            Quest: Implement Auth
          </Text>
          <Text
            size="xs"
            px={8}
            py={2}
            style={{
              color: theme.colors['bg-deep'],
              backgroundColor: theme.colors['success'],
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            COMPLETE
          </Text>
        </Group>
        <Group gap="lg">
          <Text size="xs" style={{ color: theme.colors['text-dim'] }}>
            Steps: 12/12
          </Text>
          <Text size="xs" style={{ color: theme.colors['loot-gold'] }}>
            +3 Contracts
          </Text>
          <Text size="xs" style={{ color: theme.colors['loot-rare'] }}>
            Rare: Auth Broker
          </Text>
          <Text size="xs" style={{ color: theme.colors['danger'] }}>
            2 Failed
          </Text>
          <Text size="xs" style={{ color: theme.colors['warning'] }}>
            1 Blocked
          </Text>
        </Group>
      </Box>

      {/* Swatches */}
      <SimpleGrid cols={4} spacing="sm">
        {Object.entries(theme.colors).map(([label, color]) => (
          <Swatch key={label} label={label} color={color} theme={theme} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
