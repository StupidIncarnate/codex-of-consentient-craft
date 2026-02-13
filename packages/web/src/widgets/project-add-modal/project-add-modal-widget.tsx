/**
 * PURPOSE: Modal for adding a new project with name input and directory path selection
 *
 * USAGE:
 * <ProjectAddModalWidget opened={true} onClose={fn} onSubmit={fn} />
 * // Renders modal with name input, path display, browse button, and create/cancel actions
 */

import { useState } from 'react';

import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';

import type { ProjectName, ProjectPath } from '@dungeonmaster/shared/contracts';
import { projectNameContract, projectPathContract } from '@dungeonmaster/shared/contracts';

import { DirectoryBrowserModalWidget } from '../directory-browser-modal/directory-browser-modal-widget';

export interface ProjectAddModalWidgetProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (params: { name: ProjectName; path: ProjectPath }) => void;
}

export const ProjectAddModalWidget = ({
  opened,
  onClose,
  onSubmit,
}: ProjectAddModalWidgetProps): React.JSX.Element => {
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
        title="Add Project"
      >
        <Stack gap="md">
          <TextInput
            label="Project Name"
            placeholder="My Project"
            required
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
            }}
            data-testid="PROJECT_NAME_INPUT"
          />
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Project Path
            </Text>
            <Group gap="sm">
              <Text
                size="sm"
                {...(!path && { c: 'dimmed' })}
                style={{ flex: 1 }}
                data-testid="PROJECT_PATH_DISPLAY"
              >
                {path || 'No path selected'}
              </Text>
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
          </Stack>
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
                  name: projectNameContract.parse(name.trim()),
                  path: projectPathContract.parse(path.trim()),
                });
                setName('');
                setPath('');
              }}
              disabled={!name.trim() || !path.trim()}
              data-testid="CREATE_PROJECT_BUTTON"
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
