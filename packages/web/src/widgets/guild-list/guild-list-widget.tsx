/**
 * PURPOSE: Renders a list of guilds (projects) with selection state and add button
 *
 * USAGE:
 * <GuildListWidget projects={projects} selectedProjectId={id} onSelect={handleSelect} onAdd={handleAdd} />
 * // Renders GUILDS header with project list and selection highlighting
 */

import { Group, Stack, Text, UnstyledButton } from '@mantine/core';

import type { ProjectId } from '@dungeonmaster/shared/contracts';
import type { ProjectListItem } from '@dungeonmaster/shared/contracts';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';

export interface GuildListWidgetProps {
  projects: readonly ProjectListItem[];
  selectedProjectId: ProjectId | null;
  onSelect: (params: { id: ProjectId }) => void;
  onAdd: () => void;
}

const ITEM_FONT_SIZE = 12;
const BORDER_WIDTH = 2;

export const GuildListWidget = ({
  projects,
  selectedProjectId,
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
      {projects.map((project) => {
        const isSelected = selectedProjectId === project.id;

        return (
          <UnstyledButton
            key={project.id}
            onClick={() => {
              onSelect({ id: project.id });
            }}
            px="xs"
            py={3}
            data-testid={`GUILD_ITEM_${project.id}`}
            style={{
              fontFamily: 'monospace',
              fontSize: ITEM_FONT_SIZE,
              color: isSelected ? colors['loot-gold'] : colors.text,
              backgroundColor: isSelected ? colors['bg-raised'] : 'transparent',
              borderRadius: 2,
              borderLeft: `${BORDER_WIDTH}px solid ${isSelected ? colors['loot-gold'] : 'transparent'}`,
            }}
          >
            {project.name}
          </UnstyledButton>
        );
      })}
    </Stack>
  );
};
