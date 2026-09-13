/**
 * PURPOSE: Renders one guild as a selectable row, highlighted when its id matches the currently
 * selected guild.
 *
 * USAGE:
 * <GuildRowLayerWidget guild={guild} selectedGuildId={selectedGuildId} onSelect={onSelect} />
 * // Renders the guild's name, styled gold when selectedGuildId equals guild.id
 */

import { UnstyledButton } from '@mantine/core';

import type { GuildId, GuildListItem } from '@dungeonmaster/shared/contracts';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface GuildRowLayerWidgetProps {
  guild: GuildListItem;
  selectedGuildId: GuildId | null;
  onSelect: (params: { id: GuildId }) => void;
}

const ITEM_FONT_SIZE = 12;
const BORDER_WIDTH = 2;

export const GuildRowLayerWidget = ({
  guild,
  selectedGuildId,
  onSelect,
}: GuildRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const isSelected = selectedGuildId === guild.id;

  return (
    <UnstyledButton
      onClick={() => {
        onSelect({ id: guild.id });
      }}
      px="xs"
      py={3}
      data-testid={`GUILD_ITEM_${guild.id}`}
      style={{
        fontFamily: 'monospace',
        fontSize: ITEM_FONT_SIZE,
        color: isSelected ? colors['loot-gold'] : colors.text,
        backgroundColor: isSelected ? colors['bg-raised'] : 'transparent',
        borderRadius: 2,
        borderLeft: `${BORDER_WIDTH}px solid ${isSelected ? colors['loot-gold'] : 'transparent'}`,
      }}
    >
      {guild.name}
    </UnstyledButton>
  );
};
