/**
 * PURPOSE: Displays a table of quests with a create dialog for managing the quest list
 *
 * USAGE:
 * <QuestListWidget quests={quests} loading={loading} error={error} onRefresh={refresh} onSelectQuest={handleSelect} />
 * // Renders quest table with status badges, progress, and new quest modal
 */

import { useState } from 'react';

import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type {
  ErrorMessage,
  ProjectId,
  QuestId,
  QuestListItem,
} from '@dungeonmaster/shared/contracts';

import { questCreateBroker } from '../../brokers/quest/create/quest-create-broker';
import { questStatusColorsStatics } from '../../statics/quest-status-colors/quest-status-colors-statics';

export interface QuestListWidgetProps {
  projectId: ProjectId;
  quests: QuestListItem[];
  loading: boolean;
  error: ErrorMessage | null;
  onRefresh: () => void;
  onSelectQuest: ({ questId }: { questId: QuestId }) => void;
}

export const QuestListWidget = ({
  projectId,
  quests,
  loading,
  error,
  onRefresh,
  onSelectQuest,
}: QuestListWidgetProps): React.JSX.Element => {
  const [opened, { open, close }] = useDisclosure(false);
  const [title, setTitle] = useState('');
  const [userRequest, setUserRequest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<ErrorMessage | null>(null);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Quests</Title>
        <Group gap="sm">
          <Button
            variant="filled"
            onClick={() => {
              setCreateError(null);
              open();
            }}
          >
            New Quest
          </Button>
          <Button variant="light" onClick={onRefresh} loading={loading}>
            Refresh
          </Button>
        </Group>
      </Group>

      <Modal opened={opened} onClose={close} title="Create New Quest">
        <Stack gap="md">
          {createError && (
            <Alert color="red" title="Error">
              {createError}
            </Alert>
          )}
          <TextInput
            label="Title"
            placeholder="Quest title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.currentTarget.value);
            }}
          />
          <Textarea
            label="User Request"
            placeholder="Describe what you want to accomplish"
            required
            minRows={4}
            value={userRequest}
            onChange={(e) => {
              setUserRequest(e.currentTarget.value);
            }}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!title.trim() || !userRequest.trim()) return;
                setSubmitting(true);
                setCreateError(null);
                questCreateBroker({
                  projectId,
                  title: title.trim(),
                  userRequest: userRequest.trim(),
                })
                  .then(() => {
                    setTitle('');
                    setUserRequest('');
                    close();
                    onRefresh();
                  })
                  .catch(() => {
                    setCreateError(errorMessageContract.parse('Failed to create quest'));
                  })
                  .finally(() => {
                    setSubmitting(false);
                  });
              }}
              loading={submitting}
              disabled={!title.trim() || !userRequest.trim()}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>

      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      {loading && quests.length === 0 ? (
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      ) : quests.length === 0 ? (
        <Text c="dimmed" ta="center" p="xl">
          No quests found. Create a quest to get started.
        </Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Progress</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {quests.map((quest) => (
              <Table.Tr
                key={quest.id}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onSelectQuest({ questId: quest.id });
                }}
              >
                <Table.Td>
                  <Text fw={500}>{quest.title}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      (Reflect.get(questStatusColorsStatics.status, quest.status) as
                        | undefined
                        | 'yellow'
                        | 'green'
                        | 'gray'
                        | 'blue'
                        | 'cyan'
                        | 'red'
                        | 'orange'
                        | 'teal') ?? 'gray'
                    }
                  >
                    {quest.status}
                  </Badge>
                </Table.Td>
                <Table.Td style={{ minWidth: 150 }}>
                  <Text size="xs" c="dimmed">
                    {quest.stepProgress ?? '-'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
};
