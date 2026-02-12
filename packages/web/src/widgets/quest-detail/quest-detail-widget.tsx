/**
 * PURPOSE: Displays full quest details with tabs for overview, requirements, steps, and contracts
 *
 * USAGE:
 * <QuestDetailWidget quest={quest} loading={loading} error={error} onBack={handleBack} onStartQuest={handleStart} isRunning={isRunning} processStatus={status} slotOutputs={outputs} />
 * // Renders quest detail view with tabs and execution dashboard
 */

import { useState } from 'react';

import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  List,
  Loader,
  Modal,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import type { OrchestrationStatus, Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { questVerifyBroker } from '../../brokers/quest/verify/quest-verify-broker';
import type { QuestVerifyResult } from '../../contracts/quest-verify-result/quest-verify-result-contract';
import type { AgentOutputLine } from '../../contracts/agent-output-line/agent-output-line-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import { questStatusColorsStatics } from '../../statics/quest-status-colors/quest-status-colors-statics';
import { ExecutionDashboardWidget } from '../execution-dashboard/execution-dashboard-widget';

export interface QuestDetailWidgetProps {
  quest: Quest | null;
  loading: boolean;
  error: Error | null;
  onBack: () => void;
  onStartQuest: ({ questId }: { questId: QuestId }) => void;
  isRunning: boolean;
  processStatus: OrchestrationStatus | null;
  slotOutputs: Map<SlotIndex, AgentOutputLine[]>;
}

export const QuestDetailWidget = ({
  quest,
  loading,
  error,
  onBack,
  onStartQuest,
  isRunning,
  processStatus,
  slotOutputs,
}: QuestDetailWidgetProps): React.JSX.Element => {
  const [verifyResult, setVerifyResult] = useState<QuestVerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyModalOpened, verifyModalHandlers] = useDisclosure(false);

  if (loading) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    );
  }

  if (error) {
    return (
      <Stack gap="md">
        <Button variant="subtle" onClick={onBack}>
          Back to list
        </Button>
        <Alert color="red" title="Error">
          {error.message}
        </Alert>
      </Stack>
    );
  }

  if (!quest) {
    return (
      <Stack gap="md">
        <Button variant="subtle" onClick={onBack}>
          Back to list
        </Button>
        <Text c="dimmed">Quest not found</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <Button variant="subtle" onClick={onBack}>
            Back to list
          </Button>
          <Title order={3}>{quest.title}</Title>
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
            size="lg"
          >
            {quest.status}
          </Badge>
        </Group>
        <Group gap="sm">
          <Button
            variant="light"
            onClick={() => {
              setVerifying(true);
              setVerifyResult(null);
              questVerifyBroker({ questId: quest.id })
                .then((result: QuestVerifyResult) => {
                  setVerifyResult(result);
                  verifyModalHandlers.open();
                })
                .catch((err: unknown) => {
                  setVerifyResult({
                    success: false,
                    checks: [],
                  });
                  verifyModalHandlers.open();
                  if (err instanceof Error) {
                    setVerifyResult({ success: false, checks: [] });
                  }
                })
                .finally(() => {
                  setVerifying(false);
                });
            }}
            loading={verifying}
          >
            Verify Quest
          </Button>
          {!isRunning && quest.status !== 'complete' && (
            <Button
              onClick={() => {
                onStartQuest({ questId: quest.id });
              }}
              color="green"
            >
              Start Quest
            </Button>
          )}
        </Group>
      </Group>

      <Modal
        opened={verifyModalOpened}
        onClose={verifyModalHandlers.close}
        title="Verification Results"
        size="lg"
      >
        {verifyResult && (
          <Stack gap="md">
            {verifyResult.success ? (
              <Alert color="green" title="All checks passed">
                Quest structure is valid. All {verifyResult.checks.length} checks passed.
              </Alert>
            ) : (
              <Alert color="orange" title="Issues found">
                Some verification checks did not pass.
              </Alert>
            )}

            {verifyResult.checks.length > 0 && (
              <List spacing="xs">
                {verifyResult.checks.map((check) => (
                  <List.Item
                    key={check.name}
                    icon={
                      <Badge color={check.passed ? 'green' : 'red'} size="sm" variant="filled">
                        {check.passed ? 'PASS' : 'FAIL'}
                      </Badge>
                    }
                  >
                    <Text fw={500} component="span">
                      {check.name}
                    </Text>
                    {check.message && (
                      <>
                        {' - '}
                        <Text component="span" size="sm" c="dimmed">
                          {check.message}
                        </Text>
                      </>
                    )}
                  </List.Item>
                ))}
              </List>
            )}
          </Stack>
        )}
      </Modal>

      {isRunning && processStatus && (
        <ExecutionDashboardWidget status={processStatus} slotOutputs={slotOutputs} />
      )}

      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="requirements">Requirements ({quest.requirements.length})</Tabs.Tab>
          <Tabs.Tab value="steps">Steps ({quest.steps.length})</Tabs.Tab>
          <Tabs.Tab value="contracts">Contracts ({quest.contracts.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            <Card shadow="xs" p="md" withBorder>
              <Text fw={500} mb="xs">
                Summary
              </Text>
              <Group gap="xl">
                <div>
                  <Text size="sm" c="dimmed">
                    Requirements
                  </Text>
                  <Text fw={500}>{quest.requirements.length}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">
                    Contexts
                  </Text>
                  <Text fw={500}>{quest.contexts.length}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">
                    Observables
                  </Text>
                  <Text fw={500}>{quest.observables.length}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">
                    Steps
                  </Text>
                  <Text fw={500}>{quest.steps.length}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">
                    Contracts
                  </Text>
                  <Text fw={500}>{quest.contracts.length}</Text>
                </div>
              </Group>
            </Card>

            {quest.contexts.length > 0 && (
              <Card shadow="xs" p="md" withBorder>
                <Text fw={500} mb="xs">
                  Contexts
                </Text>
                <List>
                  {quest.contexts.map((ctx) => (
                    <List.Item key={ctx.id}>
                      <Text fw={500} component="span">
                        {ctx.name}
                      </Text>
                      {' - '}
                      <Text component="span" c="dimmed">
                        {ctx.description}
                      </Text>
                    </List.Item>
                  ))}
                </List>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="requirements" pt="md">
          {quest.requirements.length === 0 ? (
            <Text c="dimmed">No requirements defined</Text>
          ) : (
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {quest.requirements.map((req) => (
                  <Table.Tr key={req.id}>
                    <Table.Td>
                      <Text fw={500}>{req.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{req.description}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          (Reflect.get(questStatusColorsStatics.status, req.status ?? 'pending') as
                            | undefined
                            | 'yellow'
                            | 'green'
                            | 'gray') ?? 'gray'
                        }
                      >
                        {req.status ?? 'pending'}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="steps" pt="md">
          {quest.steps.length === 0 ? (
            <Text c="dimmed">No steps defined</Text>
          ) : (
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Dependencies</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {quest.steps.map((step) => (
                  <Table.Tr key={step.id}>
                    <Table.Td>
                      <Text fw={500}>{step.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" lineClamp={2}>
                        {step.description}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          (Reflect.get(questStatusColorsStatics.status, step.status) as
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
                        {step.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {step.dependsOn.length > 0 ? (
                        <Text size="xs" c="dimmed">
                          {step.dependsOn.length} dep{step.dependsOn.length === 1 ? '' : 's'}
                        </Text>
                      ) : (
                        <Text size="xs" c="dimmed">
                          None
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="contracts" pt="md">
          {quest.contracts.length === 0 ? (
            <Text c="dimmed">No contracts defined</Text>
          ) : (
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Kind</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {quest.contracts.map((contract) => (
                  <Table.Tr key={contract.id}>
                    <Table.Td>
                      <Text fw={500}>{contract.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="outline">{contract.kind}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          (Reflect.get(questStatusColorsStatics.contractStatus, contract.status) as
                            | undefined
                            | 'blue'
                            | 'gray'
                            | 'orange') ?? 'gray'
                        }
                      >
                        {contract.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
