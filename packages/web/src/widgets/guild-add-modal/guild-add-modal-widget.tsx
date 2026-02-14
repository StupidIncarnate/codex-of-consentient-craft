/**
 * PURPOSE: Modal for adding a new guild with name input and directory path selection
 *
 * USAGE:
 * <GuildAddModalWidget opened={true} onClose={fn} onSubmit={fn} />
 * // Renders modal with name input, path display, browse button, and create/cancel actions
 */

import { useState } from 'react';

import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';

import type { GuildName, GuildPath } from '@dungeonmaster/shared/contracts';
import { guildNameContract, guildPathContract } from '@dungeonmaster/shared/contracts';

import { DirectoryBrowserModalWidget } from '../directory-browser-modal/directory-browser-modal-widget';

export interface GuildAddModalWidgetProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (params: { name: GuildName; path: GuildPath }) => void;
}

export const GuildAddModalWidget = ({
  opened,
  onClose,
  onSubmit,
}: GuildAddModalWidgetProps): React.JSX.Element => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [browserOpened, setBrowserOpened] = useState(false);

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => {
          setName('');
          setPath('');
          onClose();
        }}
        title="Add Guild"
      >
        <Stack gap="md">
          <TextInput
            label="Guild Name"
            placeholder="My Guild"
            required
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
            }}
            data-testid="GUILD_NAME_INPUT"
          />
          <Group gap="sm" align="flex-end">
            <TextInput
              label="Guild Path"
              placeholder="/path/to/guild"
              required
              value={path}
              onChange={(e) => {
                setPath(e.currentTarget.value);
              }}
              style={{ flex: 1 }}
              data-testid="GUILD_PATH_DISPLAY"
            />
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                setBrowserOpened(true);
              }}
              data-testid="BROWSE_BUTTON"
            >
              Browse
            </Button>
          </Group>
          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={() => {
                setName('');
                setPath('');
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!name.trim() || !path.trim()) return;
                onSubmit({
                  name: guildNameContract.parse(name.trim()),
                  path: guildPathContract.parse(path.trim()),
                });
                setName('');
                setPath('');
              }}
              disabled={!name.trim() || !path.trim()}
              data-testid="CREATE_GUILD_BUTTON"
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
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
