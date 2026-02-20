/**
 * PURPOSE: Displays full quest details as a single scrollable view with all sections visible
 *
 * USAGE:
 * <QuestDetailWidget quest={quest} loading={loading} error={error} onBack={handleBack} onStartQuest={handleStart} isRunning={isRunning} processStatus={status} slotOutputs={outputs} />
 * // Renders quest detail view with all sections in a single scrollable layout
 */

import { useState } from 'react';

import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  List,
  Loader,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import type {
  Context,
  DesignDecision,
  Flow,
  Observable,
  OrchestrationStatus,
  Quest,
  QuestContractEntry,
  QuestId,
  Requirement,
  ToolingRequirement,
} from '@dungeonmaster/shared/contracts';

import { questVerifyBroker } from '../../brokers/quest/verify/quest-verify-broker';
import type { QuestVerifyResult } from '../../contracts/quest-verify-result/quest-verify-result-contract';
import type { AgentOutputLine } from '../../contracts/agent-output-line/agent-output-line-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import type { TagItem } from '../../contracts/tag-item/tag-item-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { questStatusColorsStatics } from '../../statics/quest-status-colors/quest-status-colors-statics';
import { ExecutionDashboardWidget } from '../execution-dashboard/execution-dashboard-widget';
import { FormTagListWidget } from '../form-tag-list/form-tag-list-widget';
import { PlanSectionWidget } from '../plan-section/plan-section-widget';

const { colors } = emberDepthsThemeStatics;

const REQUIREMENTS_LABEL = 'REQUIREMENTS' as SectionLabel;
const DESIGN_DECISIONS_LABEL = 'DESIGN DECISIONS' as SectionLabel;
const FLOWS_LABEL = 'FLOWS' as SectionLabel;
const CONTEXTS_LABEL = 'CONTEXTS' as SectionLabel;
const OBSERVABLES_LABEL = 'OBSERVABLES' as SectionLabel;
const STEPS_LABEL = 'STEPS' as SectionLabel;
const CONTRACTS_LABEL = 'CONTRACTS' as SectionLabel;
const TOOLING_LABEL = 'TOOLING' as SectionLabel;
const REQS_TAG_LABEL = 'reqs' as SectionLabel;
const DEPENDS_TAG_LABEL = 'depends' as SectionLabel;
const OBSERVABLES_TAG_LABEL = 'observables' as SectionLabel;

const HEADER_FONT_SIZE = 'xs' as const;
const LABEL_FONT_SIZE = 10;
const PROPERTY_FONT_SIZE = 10;
const FIELD_MARGIN_TOP_PX = 2;

const REQUIREMENT_STATUS_COLORS = {
  proposed: colors.warning,
  approved: colors.success,
  deferred: colors['text-dim'],
} as const;

const VERIFICATION_STATUS_COLORS = {
  pending: colors.warning,
  verified: colors.success,
  failed: colors.danger,
} as const;

const CONTRACT_STATUS_COLORS = {
  new: colors.success,
  existing: colors['text-dim'],
  modified: colors.warning,
} as const;

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
      {/* 1. Title bar + status badge + action buttons */}
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

      {/* 2. Summary card */}
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
              Design Decisions
            </Text>
            <Text fw={500}>{quest.designDecisions.length}</Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">
              Flows
            </Text>
            <Text fw={500}>{quest.flows.length}</Text>
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
          <div>
            <Text size="sm" c="dimmed">
              Tooling
            </Text>
            <Text fw={500}>{quest.toolingRequirements.length}</Text>
          </div>
        </Group>
      </Card>

      {/* 3. Requirements */}
      <PlanSectionWidget
        title={REQUIREMENTS_LABEL}
        items={quest.requirements}
        renderItem={(requirement: Requirement) => (
          <Group gap={8} wrap="nowrap" align="flex-start">
            <Box style={{ flex: 1 }}>
              <Text ff="monospace" size={HEADER_FONT_SIZE} fw={600} style={{ color: colors.text }}>
                {requirement.name}
              </Text>
              <Text ff="monospace" size={HEADER_FONT_SIZE} style={{ color: colors['text-dim'] }}>
                {requirement.description}
              </Text>
              <Text ff="monospace" size={HEADER_FONT_SIZE} style={{ color: colors['text-dim'] }}>
                scope: {requirement.scope}
              </Text>
            </Box>
            <Text
              ff="monospace"
              size={HEADER_FONT_SIZE}
              fw={600}
              style={{
                color:
                  (Reflect.get(REQUIREMENT_STATUS_COLORS, requirement.status ?? 'proposed') as
                    | (typeof colors)['text-dim']
                    | undefined) ?? colors['text-dim'],
                flexShrink: 0,
              }}
            >
              {(requirement.status ?? 'proposed').toUpperCase()}
            </Text>
          </Group>
        )}
      />

      {/* 4. Design Decisions */}
      <PlanSectionWidget
        title={DESIGN_DECISIONS_LABEL}
        items={quest.designDecisions}
        renderItem={(decision: DesignDecision) => (
          <Box>
            <Text ff="monospace" size={HEADER_FONT_SIZE} fw={600} style={{ color: colors.text }}>
              {decision.title}
            </Text>
            <Text ff="monospace" size={HEADER_FONT_SIZE} style={{ color: colors['text-dim'] }}>
              {decision.rationale}
            </Text>
            <FormTagListWidget
              label={REQS_TAG_LABEL}
              items={decision.relatedRequirements as unknown as TagItem[]}
            />
          </Box>
        )}
      />

      {/* 5. Flows */}
      <PlanSectionWidget
        title={FLOWS_LABEL}
        items={quest.flows}
        renderItem={(flow: Flow) => (
          <Box>
            <Text
              ff="monospace"
              size={HEADER_FONT_SIZE}
              fw={600}
              style={{ color: colors['loot-gold'] }}
            >
              {flow.name}
            </Text>
            <Text ff="monospace" size={HEADER_FONT_SIZE} style={{ color: colors['text-dim'] }}>
              entry: {flow.entryPoint}
            </Text>
            <Text ff="monospace" style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}>
              exit: {flow.exitPoints.join(', ')}
            </Text>
          </Box>
        )}
      />

      {/* 6. Contexts */}
      <PlanSectionWidget
        title={CONTEXTS_LABEL}
        items={quest.contexts}
        renderItem={(ctx: Context) => (
          <Box>
            <Text
              ff="monospace"
              size={HEADER_FONT_SIZE}
              fw={600}
              style={{ color: colors['loot-gold'] }}
            >
              {ctx.name}
            </Text>
            <Text ff="monospace" size={HEADER_FONT_SIZE} style={{ color: colors['text-dim'] }}>
              {ctx.description}
            </Text>
            {(ctx.locator.page ?? ctx.locator.section) && (
              <Text ff="monospace" style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}>
                locator: {ctx.locator.page}
                {ctx.locator.page && ctx.locator.section ? ' \u2192 ' : ''}
                {ctx.locator.section}
              </Text>
            )}
          </Box>
        )}
      />

      {/* 7. Observables */}
      <PlanSectionWidget
        title={OBSERVABLES_LABEL}
        items={quest.observables}
        renderItem={(obs: Observable) => (
          <Box>
            <Group gap={8} mb={FIELD_MARGIN_TOP_PX}>
              <Text ff="monospace" style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}>
                ctx: <span style={{ color: colors['loot-gold'] }}>{obs.contextId}</span>
              </Text>
              {obs.requirementId && (
                <Text
                  ff="monospace"
                  style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
                >
                  req: <span style={{ color: colors['loot-rare'] }}>{obs.requirementId}</span>
                </Text>
              )}
              <Text
                ff="monospace"
                style={{
                  fontSize: LABEL_FONT_SIZE,
                  color:
                    (Reflect.get(
                      VERIFICATION_STATUS_COLORS,
                      obs.verificationStatus ?? 'pending',
                    ) as (typeof colors)['text-dim'] | undefined) ?? colors['text-dim'],
                }}
              >
                {obs.verificationStatus ?? 'pending'}
              </Text>
            </Group>
            <Text ff="monospace" size={HEADER_FONT_SIZE} style={{ color: colors['text-dim'] }}>
              WHEN <span style={{ color: colors.text }}>{obs.trigger}</span>
            </Text>
            {obs.outcomes.map((oc, oi) => (
              <Text
                key={String(oi)}
                ff="monospace"
                size={HEADER_FONT_SIZE}
                style={{ color: colors['text-dim'] }}
              >
                THEN <span style={{ color: colors.success }}>{oc.description}</span>{' '}
                <span style={{ fontSize: LABEL_FONT_SIZE }}>({oc.type})</span>
              </Text>
            ))}
            {obs.dependsOn.length > 0 && (
              <FormTagListWidget
                label={DEPENDS_TAG_LABEL}
                items={obs.dependsOn as unknown as TagItem[]}
              />
            )}
          </Box>
        )}
      />

      {/* 8. Steps */}
      <PlanSectionWidget
        title={STEPS_LABEL}
        items={quest.steps}
        renderItem={(step) => (
          <Group gap={8} wrap="nowrap" align="flex-start">
            <Box style={{ flex: 1 }}>
              <Text fw={500}>{step.name}</Text>
              <Text size="sm" lineClamp={2} c="dimmed">
                {step.description}
              </Text>
            </Box>
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
            {step.dependsOn.length > 0 ? (
              <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                {step.dependsOn.length} dep{step.dependsOn.length === 1 ? '' : 's'}
              </Text>
            ) : (
              <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                None
              </Text>
            )}
          </Group>
        )}
      />

      {/* 9. Contracts */}
      <PlanSectionWidget
        title={CONTRACTS_LABEL}
        items={quest.contracts}
        renderItem={(contract: QuestContractEntry) => (
          <Box>
            <Group gap={8}>
              <Text
                ff="monospace"
                size={HEADER_FONT_SIZE}
                fw={600}
                style={{ color: colors['loot-rare'] }}
              >
                {contract.name}
              </Text>
              <Text ff="monospace" size={HEADER_FONT_SIZE} style={{ color: colors['text-dim'] }}>
                {contract.kind}
              </Text>
              <Text
                ff="monospace"
                size={HEADER_FONT_SIZE}
                style={{
                  color:
                    (Reflect.get(CONTRACT_STATUS_COLORS, contract.status) as
                      | (typeof colors)['text-dim']
                      | undefined) ?? colors['text-dim'],
                }}
              >
                {contract.status}
              </Text>
            </Group>
            {contract.source !== undefined && (
              <Text
                ff="monospace"
                style={{ fontSize: PROPERTY_FONT_SIZE, color: colors['text-dim'] }}
              >
                {contract.source}
              </Text>
            )}
            {contract.properties.map((property, propertyIndex) => (
              <Text
                key={`${property.name}-${String(propertyIndex)}`}
                ff="monospace"
                style={{ fontSize: PROPERTY_FONT_SIZE, color: colors['text-dim'] }}
              >
                {property.name}:{' '}
                <span style={{ color: colors.text }}>{property.type ?? property.value}</span>
                {property.description !== undefined && ` \u2014 ${property.description}`}
              </Text>
            ))}
          </Box>
        )}
      />

      {/* 10. Tooling */}
      <PlanSectionWidget
        title={TOOLING_LABEL}
        items={quest.toolingRequirements}
        renderItem={(tool: ToolingRequirement) => (
          <Box>
            <Group gap={8}>
              <Text ff="monospace" size={HEADER_FONT_SIZE} fw={600} style={{ color: colors.text }}>
                {tool.name}
              </Text>
              <Text ff="monospace" size={HEADER_FONT_SIZE} style={{ color: colors['text-dim'] }}>
                {tool.packageName}
              </Text>
              <Text ff="monospace" size={HEADER_FONT_SIZE} style={{ color: colors['text-dim'] }}>
                {'\u2014'} {tool.reason}
              </Text>
            </Group>
            <FormTagListWidget
              label={OBSERVABLES_TAG_LABEL}
              items={tool.requiredByObservables as unknown as TagItem[]}
            />
          </Box>
        )}
      />
    </Stack>
  );
};
