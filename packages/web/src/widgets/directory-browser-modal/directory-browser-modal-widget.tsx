/**
 * PURPOSE: Modal for browsing OS directories to select a project path
 *
 * USAGE:
 * <DirectoryBrowserModalWidget opened={true} onClose={fn} onSelect={fn} />
 * // Renders modal with directory listing, parent navigation, and select button
 */

import { Button, Group, Loader, Modal, NavLink, Stack, Text } from '@mantine/core';

import type { GuildPath } from '@dungeonmaster/shared/contracts';

import { useDirectoryBrowserBinding } from '../../bindings/use-directory-browser/use-directory-browser-binding';

export interface DirectoryBrowserModalWidgetProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (params: { path: GuildPath }) => void;
  initialPath?: GuildPath;
}

export const DirectoryBrowserModalWidget = ({
  opened,
  onClose,
  onSelect,
}: DirectoryBrowserModalWidgetProps): React.JSX.Element => {
  const { currentPath, entries, loading, navigateTo, goUp } = useDirectoryBrowserBinding();

  return (
    <Modal opened={opened} onClose={onClose} title="Browse Directory" size="lg">
      <Stack gap="md">
        <Group gap="sm">
          <Text size="sm" fw={500} style={{ flex: 1 }} data-testid="CURRENT_PATH_DISPLAY">
            {currentPath ?? '/'}
          </Text>
          <Button
            variant="light"
            size="xs"
            onClick={goUp}
            disabled={currentPath === null}
            data-testid="GO_UP_BUTTON"
          >
            Go Up
          </Button>
        </Group>

        {loading && (
          <Group justify="center" p="md">
            <Loader size="sm" />
          </Group>
        )}

        {!loading && entries.length === 0 && (
          <Text c="dimmed" size="sm" ta="center" p="md" data-testid="EMPTY_DIRECTORY">
            No subdirectories found
          </Text>
        )}

        {!loading &&
          entries
            .filter((entry) => entry.isDirectory)
            .map((entry) => (
              <NavLink
                key={String(entry.path)}
                label={String(entry.name)}
                onClick={() => {
                  navigateTo({ path: entry.path });
                }}
                data-testid={`DIR_ENTRY_${String(entry.name)}`}
              />
            ))}

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (currentPath) {
                onSelect({ path: currentPath });
              }
            }}
            disabled={currentPath === null}
            data-testid="SELECT_DIRECTORY_BUTTON"
          >
            Select
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
