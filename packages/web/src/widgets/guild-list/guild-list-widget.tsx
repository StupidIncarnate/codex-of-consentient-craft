/**
 * PURPOSE: Renders a list of guilds with selection state and add button
 *
 * USAGE:
 * <GuildListWidget guilds={guilds} selectedGuildId={id} onSelect={handleSelect} onAdd={handleAdd} />
 * // Renders GUILDS header with guild list and selection highlighting
 */

import { Group, Stack, Text } from '@mantine/core';

import type { GuildId } from '@dungeonmaster/shared/contracts';
import type { GuildListItem } from '@dungeonmaster/shared/contracts';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { GuildRowLayerWidget } from './guild-row-layer-widget';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';

export interface GuildListWidgetProps {
  guilds: readonly GuildListItem[];
  selectedGuildId: GuildId | null;
  onSelect: (params: { id: GuildId }) => void;
  onAdd: () => void;
}

export const GuildListWidget = ({
  guilds,
  selectedGuildId,
  onSelect,
  onAdd,
}: GuildListWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Stack gap={4} data-testid="GUILD_LIST">
      <Group justify="space-between">
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
          GUILDS
        </Text>
        <PixelBtnWidget
          label={'+ ' as ButtonLabel}
          onClick={onAdd}
          variant={'ghost' as ButtonVariant}
          icon
        />
      </Group>
      {guilds.map((guild) => (
        <GuildRowLayerWidget
          key={guild.id}
          guild={guild}
          selectedGuildId={selectedGuildId}
          onSelect={onSelect}
        />
      ))}
    </Stack>
  );
};
