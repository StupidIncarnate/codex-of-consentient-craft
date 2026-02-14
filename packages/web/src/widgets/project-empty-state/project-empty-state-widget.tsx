/**
 * PURPOSE: Inline guild creation form displayed when no projects exist or user clicks new project
 *
 * USAGE:
 * <ProjectEmptyStateWidget onAddProject={fn} />
 * // Renders inline form with name/path inputs and CREATE button
 */

import { useState } from 'react';

import { Group, Stack, Text, TextInput } from '@mantine/core';

import type { ProjectName, ProjectPath } from '@dungeonmaster/shared/contracts';
import { projectNameContract, projectPathContract } from '@dungeonmaster/shared/contracts';

import { buttonLabelContract } from '../../contracts/button-label/button-label-contract';
import { buttonVariantContract } from '../../contracts/button-variant/button-variant-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

const INPUT_WIDTH = 260;
const INPUT_FONT_SIZE = 12;
const LABEL_FONT_SIZE = 11;

const createLabel = buttonLabelContract.parse('CREATE');
const cancelLabel = buttonLabelContract.parse('CANCEL');
const ghostVariant = buttonVariantContract.parse('ghost');

export interface ProjectEmptyStateWidgetProps {
  onAddProject: ({ name, path }: { name: ProjectName; path: ProjectPath }) => void;
  onCancel?: (() => void) | undefined;
}

export const ProjectEmptyStateWidget = ({
  onAddProject,
  onCancel,
}: ProjectEmptyStateWidgetProps): React.JSX.Element => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
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
      <Group gap="xs">
        <PixelBtnWidget
          label={createLabel}
          onClick={() => {
            onAddProject({
              name: projectNameContract.parse(name),
              path: projectPathContract.parse(path),
            });
          }}
        />
        {onCancel ? (
          <PixelBtnWidget label={cancelLabel} onClick={onCancel} variant={ghostVariant} />
        ) : null}
      </Group>
    </Stack>
  );
};
