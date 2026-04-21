/**
 * PURPOSE: Renders an expandable execution step row with status, role badge, and metadata
 *
 * USAGE:
 * <ExecutionRowLayerWidget order={order} name={name} role={role} status={status} files={files} dependsOn={deps} isAdhoc={false} />
 * // Renders step row with chevron, order number, [ROLE] badge, step name, and status
 */

import { Box, Text, UnstyledButton } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import type {
  ContractName,
  ErrorMessage,
  ObservableId,
  WardResult,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type { DependencyLabel } from '../../contracts/dependency-label/dependency-label-contract';
import type { DisplayFilePath } from '../../contracts/display-file-path/display-file-path-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import type { ExecutionStepStatus } from '../../contracts/execution-step-status/execution-step-status-contract';
import type { StepName } from '../../contracts/step-name/step-name-contract';
import type { StepOrder } from '../../contracts/step-order/step-order-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { executionStepStatusConfigStatics } from '../../statics/execution-step-status-config/execution-step-status-config-statics';
import { computeRowContextTotalTransformer } from '../../transformers/compute-row-context-total/compute-row-context-total-transformer';
import { durationDisplayTransformer } from '../../transformers/duration-display/duration-display-transformer';
import { executionRowSubtitleTransformer } from '../../transformers/execution-row-subtitle/execution-row-subtitle-transformer';
import { ChatEntryListWidget } from '../chat-entry-list/chat-entry-list-widget';
import { StreamingBarLayerWidget } from './streaming-bar-layer-widget';

export interface ExecutionRowLayerWidgetProps {
  order: StepOrder;
  name: StepName;
  role: ExecutionRole;
  status: ExecutionStepStatus;
  files: DisplayFilePath[];
  dependsOn: DependencyLabel[];
  isAdhoc: boolean;
  errorMessage?: ErrorMessage;
  summary?: WorkItem['summary'];
  entries?: ChatEntry[];
  isStreaming?: boolean;
  attempt?: WorkItem['attempt'];
  maxAttempts?: WorkItem['maxAttempts'];
  startedAt?: WorkItem['startedAt'];
  completedAt?: WorkItem['completedAt'];
  observablesSatisfied?: ObservableId[];
  inputContracts?: ContractName[];
  outputContracts?: ContractName[];
  wardResults?: WardResult[];
}

const EXPANDABLE_STATUSES: ExecutionStepStatus[] = [
  'in_progress' as ExecutionStepStatus,
  'complete' as ExecutionStepStatus,
  'partially_complete' as ExecutionStepStatus,
  'failed' as ExecutionStepStatus,
];

const ORDER_PAD_LENGTH = 2;
const CHEVRON_WIDTH = 14;
const ORDER_WIDTH = 24;
const HEADER_FONT_SIZE = 10;
const NAME_FONT_SIZE = 11;
const ADHOC_FONT_SIZE = 9;
const SUBTITLE_FONT_SIZE = 9;
const SUBTITLE_PADDING_LEFT = 44;
const EXPANDED_MARGIN_LEFT = 20;
const EXPANDED_PADDING = 8;
const EXPANDED_DETAIL_FONT_SIZE = 10;
const EXPANDED_DETAIL_MARGIN_BOTTOM = 4;
const HEADER_GAP = 6;
const HEADER_PADDING_VERTICAL = 3;
const HEADER_PADDING_HORIZONTAL = 4;
const ADHOC_BORDER_WIDTH = 2;
const ADHOC_PADDING_LEFT = 4;
const ROW_MARGIN_BOTTOM = 2;
const EXPANDED_MARGIN_VERTICAL = 4;

const CHEVRON_EXPANDED = '\u25BE';
const CHEVRON_COLLAPSED = '\u25B8';
const DOTS = '\u00B7\u00B7\u00B7';

export const ExecutionRowLayerWidget = ({
  order,
  name,
  role,
  status,
  files,
  dependsOn,
  isAdhoc,
  errorMessage,
  summary,
  entries,
  isStreaming,
  attempt,
  maxAttempts,
  startedAt,
  completedAt,
  observablesSatisfied,
  inputContracts,
  outputContracts,
  wardResults,
}: ExecutionRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const hasEntries = entries !== undefined && entries.length > 0;
  const [expanded, setExpanded] = useState(
    status === ('in_progress' as ExecutionStepStatus) && hasEntries,
  );
  const prevStatusRef = useRef<ExecutionStepStatus>(status);
  const userClickedRef = useRef(false);

  useEffect(() => {
    if (status === ('in_progress' as ExecutionStepStatus) && hasEntries && !expanded) {
      setExpanded(true);
    }
  }, [status, hasEntries, expanded]);

  useEffect(() => {
    if (
      prevStatusRef.current === ('in_progress' as ExecutionStepStatus) &&
      status !== ('in_progress' as ExecutionStepStatus) &&
      !userClickedRef.current
    ) {
      setExpanded(false);
    }
    prevStatusRef.current = status;
    userClickedRef.current = false;
  }, [status]);

  const statusCfg = executionStepStatusConfigStatics.statusConfig[status];
  const roleColor = executionStepStatusConfigStatics.roleColors[role];
  const isExpandable = EXPANDABLE_STATUSES.includes(status);
  const orderDisplay = String(order).padStart(ORDER_PAD_LENGTH, '0');
  const subtitle = executionRowSubtitleTransformer({ status, dependsOn, files });
  const headerContextLabel = computeRowContextTotalTransformer({ entries: entries ?? [] });

  return (
    <Box
      data-testid="execution-row-layer-widget"
      mb={ROW_MARGIN_BOTTOM}
      style={{
        borderLeft: isAdhoc
          ? `${ADHOC_BORDER_WIDTH}px dashed ${colors.warning}`
          : `${ADHOC_BORDER_WIDTH}px solid transparent`,
        paddingLeft: isAdhoc ? ADHOC_PADDING_LEFT : 0,
      }}
    >
      <UnstyledButton
        data-testid="execution-row-header"
        onClick={() => {
          if (isExpandable) {
            userClickedRef.current = true;
            setExpanded(!expanded);
          }
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: HEADER_GAP,
          padding: `${HEADER_PADDING_VERTICAL}px ${HEADER_PADDING_HORIZONTAL}px`,
          cursor: isExpandable ? 'pointer' : 'default',
          borderRadius: ROW_MARGIN_BOTTOM,
          backgroundColor: expanded ? colors['bg-raised'] : 'transparent',
        }}
      >
        <Text
          ff="monospace"
          style={{
            fontSize: HEADER_FONT_SIZE,
            color: isExpandable ? colors[roleColor] : colors['text-dim'],
            width: CHEVRON_WIDTH,
            flexShrink: 0,
            textAlign: 'center',
          }}
        >
          {isExpandable ? (expanded ? CHEVRON_EXPANDED : CHEVRON_COLLAPSED) : DOTS}
        </Text>

        <Text
          ff="monospace"
          style={{
            fontSize: HEADER_FONT_SIZE,
            color: isAdhoc ? colors.warning : colors['text-dim'],
            width: ORDER_WIDTH,
            flexShrink: 0,
          }}
        >
          {orderDisplay}
        </Text>

        <Text
          ff="monospace"
          data-testid="execution-row-role-badge"
          style={{
            fontSize: HEADER_FONT_SIZE,
            color: colors[roleColor],
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          [{role.toUpperCase()}]
        </Text>

        <Text
          ff="monospace"
          style={{
            fontSize: NAME_FONT_SIZE,
            color: colors.text,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </Text>

        {isAdhoc ? (
          <Text
            ff="monospace"
            data-testid="execution-row-adhoc-tag"
            style={{
              fontSize: ADHOC_FONT_SIZE,
              color: colors.warning,
              fontWeight: 600,
              flexShrink: 0,
              border: `1px solid ${colors.warning}`,
              borderRadius: ROW_MARGIN_BOTTOM,
              padding: '0 3px',
            }}
          >
            AD-HOC
          </Text>
        ) : null}

        {attempt !== undefined && maxAttempts !== undefined && attempt > 0 ? (
          <Text
            ff="monospace"
            data-testid="execution-row-retry-badge"
            style={{
              fontSize: ADHOC_FONT_SIZE,
              color: colors.warning,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            retry {String(attempt)}/{String(maxAttempts)}
          </Text>
        ) : null}

        {startedAt && completedAt ? (
          <Text
            ff="monospace"
            data-testid="execution-row-duration"
            style={{
              fontSize: ADHOC_FONT_SIZE,
              color: colors['text-dim'],
              flexShrink: 0,
            }}
          >
            {durationDisplayTransformer({ startedAt, completedAt })}
          </Text>
        ) : null}

        {headerContextLabel === null ? null : (
          <Text
            ff="monospace"
            data-testid="execution-row-context"
            style={{
              fontSize: ADHOC_FONT_SIZE,
              color: colors['text-dim'],
              flexShrink: 0,
            }}
          >
            {headerContextLabel} ctx
          </Text>
        )}

        <Text
          ff="monospace"
          data-testid="execution-row-status-badge"
          style={{
            fontSize: HEADER_FONT_SIZE,
            color: colors[statusCfg.color],
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {statusCfg.label}
        </Text>
      </UnstyledButton>

      {!expanded && subtitle.length > 0 ? (
        <Text
          ff="monospace"
          data-testid="execution-row-subtitle"
          style={{
            fontSize: SUBTITLE_FONT_SIZE,
            color: colors['text-dim'],
            paddingLeft: SUBTITLE_PADDING_LEFT,
            marginTop: -1,
          }}
        >
          {subtitle}
        </Text>
      ) : null}

      {expanded ? (
        <Box
          data-testid="execution-row-expanded"
          style={{
            margin: `${EXPANDED_MARGIN_VERTICAL}px 0 ${EXPANDED_MARGIN_VERTICAL}px ${EXPANDED_MARGIN_LEFT}px`,
            padding: EXPANDED_PADDING,
            backgroundColor: colors['bg-surface'],
            border: `1px solid ${colors.border}`,
            borderRadius: ROW_MARGIN_BOTTOM,
          }}
        >
          {observablesSatisfied && observablesSatisfied.length > 0 ? (
            <Text
              ff="monospace"
              data-testid="execution-row-observables"
              style={{
                fontSize: EXPANDED_DETAIL_FONT_SIZE,
                color: colors['text-dim'],
                marginBottom: EXPANDED_DETAIL_MARGIN_BOTTOM,
              }}
            >
              Satisfies: {observablesSatisfied.join(', ')}
            </Text>
          ) : null}
          {inputContracts && inputContracts.length > 0 ? (
            <Text
              ff="monospace"
              data-testid="execution-row-input-contracts"
              style={{
                fontSize: EXPANDED_DETAIL_FONT_SIZE,
                color: colors['text-dim'],
                marginBottom: EXPANDED_DETAIL_MARGIN_BOTTOM,
              }}
            >
              Inputs: {inputContracts.join(', ')}
            </Text>
          ) : null}
          {outputContracts && outputContracts.length > 0 ? (
            <Text
              ff="monospace"
              data-testid="execution-row-output-contracts"
              style={{
                fontSize: EXPANDED_DETAIL_FONT_SIZE,
                color: colors['text-dim'],
                marginBottom: EXPANDED_DETAIL_MARGIN_BOTTOM,
              }}
            >
              Outputs: {outputContracts.join(', ')}
            </Text>
          ) : null}
          {entries && entries.length > 0 ? (
            <ChatEntryListWidget
              entries={entries}
              isStreaming={isStreaming ?? false}
              roleLabel={role}
              swapTrailingEmptyThinkingForIndicator={true}
            />
          ) : null}
          {isStreaming ? <StreamingBarLayerWidget /> : null}
          {files.length > 0 ? (
            <Text
              ff="monospace"
              data-testid="execution-row-files"
              style={{
                fontSize: EXPANDED_DETAIL_FONT_SIZE,
                color: colors['text-dim'],
                marginBottom: EXPANDED_DETAIL_MARGIN_BOTTOM,
              }}
            >
              Files: {files.join(', ')}
            </Text>
          ) : null}
          {wardResults && wardResults.length > 0
            ? wardResults.map((wr) => (
                <Box
                  key={wr.id}
                  data-testid="execution-row-ward-result"
                  style={{ marginBottom: EXPANDED_DETAIL_MARGIN_BOTTOM }}
                >
                  <Text
                    ff="monospace"
                    style={{
                      fontSize: EXPANDED_DETAIL_FONT_SIZE,
                      color: wr.exitCode === 0 ? colors.success : colors.danger,
                    }}
                  >
                    Ward exit code: {String(wr.exitCode)}
                    {wr.wardMode ? ` (${wr.wardMode})` : ''}
                  </Text>
                </Box>
              ))
            : null}
          {summary ? (
            <Text
              ff="monospace"
              data-testid="execution-row-summary"
              style={{
                fontSize: EXPANDED_DETAIL_FONT_SIZE,
                color: colors['text-dim'],
                marginBottom: EXPANDED_DETAIL_MARGIN_BOTTOM,
                whiteSpace: 'pre-wrap',
              }}
            >
              Summary: {summary}
            </Text>
          ) : null}
          {errorMessage ? (
            <Text
              ff="monospace"
              data-testid="execution-row-error-message"
              style={{ fontSize: EXPANDED_DETAIL_FONT_SIZE, color: colors.danger }}
            >
              Error: {errorMessage}
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
};
