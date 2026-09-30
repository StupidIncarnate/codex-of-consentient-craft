/**
 * PURPOSE: Inline guild creation form displayed when no guilds exist or user clicks new guild.
 * CREATE refuses a path that is not absolute with an error under the path input, and
 * `onAddGuild` does not fire for it.
 *
 * USAGE:
 * <GuildEmptyStateWidget onAddGuild={fn} />
 * // Renders inline form with name/path inputs and CREATE button
 */

import { useState } from '#gateway/npm/react';

import { Group, Stack, Text, TextInput } from '#gateway/npm/mantine__core';

import { guildCreateInputContract } from '../../contracts/guild-create-input/guild-create-input-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { DirectoryBrowserModalWidget } from '../directory-browser-modal/directory-browser-modal-widget';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

const INPUT_WIDTH = 260;
const INPUT_FONT_SIZE = 12;
const LABEL_FONT_SIZE = 11;

const createLabel = 'CREATE';
const cancelLabel = 'CANCEL';
const browseLabel = 'BROWSE';
const ghostVariant = 'ghost';
const createTestId = 'GUILD_CREATE_BUTTON';
const cancelTestId = 'GUILD_CANCEL_BUTTON';
const browseTestId = 'GUILD_BROWSE_BUTTON';

export interface GuildEmptyStateWidgetProps {
  onAddGuild: ({ name, path }: { name: string; path: string }) => void;
  onCancel?: (() => void) | undefined;
}

export const GuildEmptyStateWidget = ({
  onAddGuild,
  onCancel,
}: GuildEmptyStateWidgetProps): React.JSX.Element => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [pathRejected, setPathRejected] = useState(false);
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
        <Stack gap="sm" align="flex-start" data-testid="GUILD_INPUT_ALIGNMENT_GROUP">
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
                setPathRejected(false);
              }}
              w={INPUT_WIDTH}
              styles={inputStyles}
              error={pathRejected}
              data-testid="GUILD_PATH_INPUT"
            />
            <PixelBtnWidget
              label={browseLabel}
              testId={browseTestId}
              variant={ghostVariant}
              onClick={() => {
                setBrowserOpened(true);
              }}
            />
          </Group>
          {pathRejected ? (
            <Text
              ff="monospace"
              style={{ color: colors.danger, fontSize: LABEL_FONT_SIZE }}
              data-testid="GUILD_PATH_ERROR"
            >
              Path must be absolute (start with / or C:\ on Windows)
            </Text>
          ) : null}
        </Stack>
        <Group gap="xs">
          <PixelBtnWidget
            label={createLabel}
            testId={createTestId}
            onClick={() => {
              if (!guildCreateInputContract.shape.path.safeParse(path).success) {
                setPathRejected(true);
                return;
              }
              onAddGuild({
                name,
                path,
              });
            }}
          />
          {onCancel ? (
            <PixelBtnWidget
              label={cancelLabel}
              testId={cancelTestId}
              onClick={onCancel}
              variant={ghostVariant}
            />
          ) : null}
        </Group>
      </Stack>
      <DirectoryBrowserModalWidget
        opened={browserOpened}
        onClose={() => {
          setBrowserOpened(false);
        }}
        onSelect={({ path: selectedPath }) => {
          setPath(selectedPath);
          setBrowserOpened(false);
        }}
      />
    </>
  );
};
