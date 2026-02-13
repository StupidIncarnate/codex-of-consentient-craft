/**
 * PURPOSE: Full-page empty state displayed when no projects exist
 *
 * USAGE:
 * <ProjectEmptyStateWidget onAddProject={fn} />
 * // Renders welcome message with "Create your first project" button
 */

import { Button, Center, Stack, Text, Title } from '@mantine/core';

export interface ProjectEmptyStateWidgetProps {
  onAddProject: () => void;
}

export const ProjectEmptyStateWidget = ({
  onAddProject,
}: ProjectEmptyStateWidgetProps): React.JSX.Element => (
  <Center style={{ minHeight: 400 }}>
    <Stack align="center" gap="md">
      <Title order={2}>Welcome to Dungeonmaster</Title>
      <Text c="dimmed" ta="center">
        Get started by creating your first project.
      </Text>
      <Button onClick={onAddProject} data-testid="CREATE_FIRST_PROJECT_BUTTON">
        Create your first project
      </Button>
    </Stack>
  </Center>
);
