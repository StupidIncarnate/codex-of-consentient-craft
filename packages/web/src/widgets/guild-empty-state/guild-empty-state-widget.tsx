/**
 * PURPOSE: Inline guild creation form displayed when no guilds exist or user clicks new guild
 *
 * USAGE:
 * <GuildEmptyStateWidget onAddGuild={fn} />
 * // Renders inline form with name/path inputs and CREATE button
 */

import { useState } from 'react';

import { Group, Stack, Text, TextInput } from '@mantine/core';

import type { GuildName, GuildPath } from '@dungeonmaster/shared/contracts';
import { guildNameContract, guildPathContract } from '@dungeonmaster/shared/contracts';

import { buttonLabelContract } from '../../contracts/button-label/button-label-contract';
import { buttonVariantContract } from '../../contracts/button-variant/button-variant-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { DirectoryBrowserModalWidget } from '../directory-browser-modal/directory-browser-modal-widget';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

const INPUT_WIDTH = 260;
const INPUT_FONT_SIZE = 12;
const LABEL_FONT_SIZE = 11;

const createLabel = buttonLabelContract.parse('CREATE');
const cancelLabel = buttonLabelContract.parse('CANCEL');
const browseLabel = buttonLabelContract.parse('BROWSE');
const ghostVariant = buttonVariantContract.parse('ghost');

export interface GuildEmptyStateWidgetProps {
  onAddGuild: ({ name, path }: { name: GuildName; path: GuildPath }) => void;
  onCancel?: (() => void) | undefined;
}

export const GuildEmptyStateWidget = ({
  onAddGuild,
  onCancel,
}: GuildEmptyStateWidgetProps): React.JSX.Element => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [browserOpened, setBrowserOpened] = useState(false);
  const { colors } = emberDepthsThemeStatics;

  const inputStyles = {
    input: {
      backgroundColor: colors['bg-deep'],
      borderColor: colors.border,
      color: colors.text,
      fontFamily: 'monospace',
      fontSize: INPUT_FONT_SIZE,
    },
    label: {
      color: colors['text-dim'],
      fontFamily: 'monospace',
      fontSize: LABEL_FONT_SIZE,
    },
  };

  return (
    <>
      <Stack gap="sm" align="center">
        <Text ff="monospace" size="sm" style={{ color: colors.primary }}>
          NEW GUILD
        </Text>
        <TextInput
          label="Name"
          placeholder="my-guild"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          w={INPUT_WIDTH}
          styles={inputStyles}
          data-testid="GUILD_NAME_INPUT"
        />
        <Group gap="xs" align="flex-end">
          <TextInput
            label="Path"
            placeholder="/home/user/my-guild"
            value={path}
            onChange={(e) => {
              setPath(e.target.value);
            }}
            w={INPUT_WIDTH}
            styles={inputStyles}
            data-testid="GUILD_PATH_INPUT"
          />
          <PixelBtnWidget
            label={browseLabel}
            variant={ghostVariant}
            onClick={() => {
              setBrowserOpened(true);
            }}
          />
        </Group>
        <Group gap="xs">
          <PixelBtnWidget
            label={createLabel}
            onClick={() => {
              onAddGuild({
                name: guildNameContract.parse(name),
                path: guildPathContract.parse(path),
              });
            }}
          />
          {onCancel ? (
            <PixelBtnWidget label={cancelLabel} onClick={onCancel} variant={ghostVariant} />
          ) : null}
        </Group>
      </Stack>
      <DirectoryBrowserModalWidget
        opened={browserOpened}
        onClose={() => {
          setBrowserOpened(false);
        }}
        onSelect={({ path: selectedPath }) => {
          setPath(String(selectedPath));
          setBrowserOpened(false);
        }}
      />
    </>
  );
};
