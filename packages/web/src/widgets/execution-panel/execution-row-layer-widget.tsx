/**
 * PURPOSE: Renders an expandable execution work-item row with status, role badge, and metadata.
 * Forwards the panel's shared clock (`now`) to its own transcript only while the row is
 * in_progress, so a sub-agent chain inside a finished, failed or replayed row renders no live
 * duration figure. `order` is omitted by the panel for a step row nested under an operation
 * header (decision 2's NESTED ruling) — the header alone carries the list's running number, and
 * `indented` shifts the row right and drops its own `[ROLE]` badge, since the header above it
 * already names the role for every step beneath it. `isRunningFocus` (T2-9a) limits the
 * running-row auto-expand to whichever row the panel currently hands it to, so several running
 * rows in one scope never all auto-open at once.
 *
 * USAGE:
 * <ExecutionRowLayerWidget order={order} name={name} role={role} status={status} files={files} dependsOn={deps} isAdhoc={false} />
 * // Renders work-item row with chevron, order number, [ROLE] badge, row name, and status
 */

import { Box, Text, UnstyledButton } from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  ContractName,
  ErrorMessage,
  QuestId,
  RiftcarverResult,
  WardResult,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import type { ChatEntry, CssPixels } from '@dungeonmaster/shared/contracts';
import { cssPixelsContract } from '@dungeonmaster/shared/contracts';
import { isCommandWorkItemRoleGuard } from '@dungeonmaster/shared/guards';
import type { DependencyLabel } from '../../contracts/dependency-label/dependency-label-contract';
import type { DisplayFilePath } from '../../contracts/display-file-path/display-file-path-contract';
import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import type { ExecutionRole } from '../../contracts/execution-role/execution-role-contract';
import type { ExecutionStepStatus } from '../../contracts/execution-step-status/execution-step-status-contract';
import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import type { RowOrder } from '../../contracts/row-order/row-order-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { stickyHeaderStatics } from '../../statics/sticky-header/sticky-header-statics';
import { computeRowContextTotalTransformer } from '../../transformers/compute-row-context-total/compute-row-context-total-transformer';
import { durationDisplayTransformer } from '../../transformers/duration-display/duration-display-transformer';
import { elapsedPartsTransformer } from '../../transformers/elapsed-parts/elapsed-parts-transformer';
import { executionRowDisplayResolveTransformer } from '../../transformers/execution-row-display-resolve/execution-row-display-resolve-transformer';
import { executionRowSubtitleTransformer } from '../../transformers/execution-row-subtitle/execution-row-subtitle-transformer';
import { mergeCommandOutputEntriesTransformer } from '../../transformers/merge-command-output-entries/merge-command-output-entries-transformer';
import { runningRowNowTransformer } from '../../transformers/running-row-now/running-row-now-transformer';
import { stickyHeaderZIndexTransformer } from '../../transformers/sticky-header-z-index/sticky-header-z-index-transformer';
import { ChatEntryListWidget } from '../chat-entry-list/chat-entry-list-widget';
import { ExecutionRowMintedByBadgeLayerWidget } from './execution-row-minted-by-badge-layer-widget';
import { ExecutionRowScopeChurnLayerWidget } from './execution-row-scope-churn-layer-widget';
import { ExecutionRowUnitMarksLayerWidget } from './execution-row-unit-marks-layer-widget';
import { ExecutionRowUnmetListLayerWidget } from './execution-row-unmet-list-layer-widget';
import { RiftcarverResultRowLayerWidget } from './riftcarver-result-row-layer-widget';
import { StreamingBarLayerWidget } from './streaming-bar-layer-widget';
import { WardResultRowLayerWidget } from './ward-result-row-layer-widget';

export interface ExecutionRowLayerWidgetProps {
  // Omitted for a step row nested under an operation header — the header alone is numbered.
  order?: RowOrder;
  name: DisplayLabel;
  role: ExecutionRole;
  status: ExecutionStepStatus;
  files: DisplayFilePath[];
  dependsOn: DependencyLabel[];
  isAdhoc: boolean;
  // Set on a step row nested under an operation header (decision 2's NESTED ruling): shifts the
  // row right and drops its own [ROLE] badge, since the header already names the scope's role.
  indented?: boolean;
  // The back-edge badge: set when `workItem.mintedBy` names a real predecessor, resolved by the
  // panel to that row's own four-tier label (T2-1) rather than a raw id. Never derived from
  // `insertedBy` — that field means a retry splice superseding a failed item, a different edge.
  mintedByLabel?: DisplayLabel;
  errorMessage?: ErrorMessage;
  // Carries summary, attempt, maxAttempts, startedAt, completedAt and actualSignal as ONE object
  // rather than six flattened WorkItem['x'] properties, so a caller passes the work item it already
  // has instead of picking it apart field by field.
  workItem?: WorkItem;
  // The scope's own work items, in array order — set ONLY on a scope HEADER row (which carries no
  // `workItem` of its own), so ExecutionRowScopeChurnLayerWidget can read the churn sequence a
  // single claimed row's own `workItem` cannot see past. Undefined for every other row.
  scopeWorkItems?: WorkItem[];
  entries?: ChatEntry[];
  isStreaming?: boolean;
  autoExpand?: boolean;
  // The panel's shared 60-second tick supplies this; it is the end point a RUNNING item's figure
  // measures to, and a finished item ignores it.
  now?: IsoTimestamp;
  inputContracts?: ContractName[];
  outputContracts?: ContractName[];
  wardResults?: WardResult[];
  riftcarverResults?: RiftcarverResult[];
  questId?: QuestId;
  // Governs the running-row auto-expand alone (T2-9a) — the manual chevron click below is never
  // gated by it. Undefined/true keeps today's behaviour (every in_progress row with a transcript
  // auto-expands on its own); explicit `false` means the panel already gave that focus to some
  // OTHER row this render, so this one starts collapsed until either it becomes the focus (the
  // panel flips this back once the current focus row stops) or the reader clicks its header.
  isRunningFocus?: boolean;
}

const EXPANDABLE_STATUSES: ExecutionStepStatus[] = [
  'in_progress' as ExecutionStepStatus,
  'complete' as ExecutionStepStatus,
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
// How far a step row sits under its operation header — decision 2's "indented step rows beneath".
const CHILD_ROW_INDENT_LEFT = 20;

const CHEVRON_EXPANDED = '\u25BE';
const CHEVRON_COLLAPSED = '\u25B8';
const DOTS = '\u00B7\u00B7\u00B7';

// This row is the outermost expandable in the execution panel's scroll area, so its header pins
// flush to the top and everything it contains pins below that header's own height.
const STICKY_TOP_ROOT = cssPixelsContract.parse(0);
const STICKY_TOP_INSIDE_ROW: CssPixels = cssPixelsContract.parse(
  stickyHeaderStatics.heights.executionRow,
);

export const ExecutionRowLayerWidget = ({
  order,
  name,
  role,
  status,
  files,
  dependsOn,
  isAdhoc,
  indented,
  mintedByLabel,
  errorMessage,
  workItem,
  scopeWorkItems,
  entries,
  isStreaming,
  autoExpand,
  now,
  inputContracts,
  outputContracts,
  wardResults,
  riftcarverResults,
  questId,
  isRunningFocus,
}: ExecutionRowLayerWidgetProps): React.JSX.Element => {
  const { summary, attempt, maxAttempts, startedAt, completedAt, actualSignal } = workItem ?? {};
  const { colors } = emberDepthsThemeStatics;
  const hasEntries = entries !== undefined && entries.length > 0;
  // A COMMAND row (ward, riftcarver) streams raw program output one entry per LINE, so it is
  // rejoined into one block per run before rendering and rendered verbatim rather than as markdown.
  // Both are gated on the role rather than sniffed from content: an agent's consecutive text
  // entries are genuinely separate messages, and its markdown is genuinely markdown.
  const isCommandRow = isCommandWorkItemRoleGuard({ role });
  const displayEntries = isCommandRow
    ? mergeCommandOutputEntriesTransformer({ entries: entries ?? [] })
    : (entries ?? []);
  // Lazy initializer: the isRunningFocus check below is a branch on this callback, not on the
  // component body, which is already at the repo's `complexity: max 50` ceiling. Only the
  // in_progress disjunct is gated — the autoExpand disjunct (terminal-quest-with-no-operations
  // rendering) auto-expands every row regardless of running focus, since that scenario runs no
  // work item and the panel would otherwise hand every row an `isRunningFocus: false` it never
  // earned.
  const [expanded, setExpanded] = useState(
    () =>
      (isRunningFocus !== false &&
        status === ('in_progress' as ExecutionStepStatus) &&
        hasEntries) ||
      (autoExpand === true && hasEntries),
  );
  const prevStatusRef = useRef<ExecutionStepStatus>(status);
  const userClickedRef = useRef(false);

  useEffect(() => {
    if (
      isRunningFocus !== false &&
      status === ('in_progress' as ExecutionStepStatus) &&
      hasEntries &&
      !expanded &&
      !userClickedRef.current
    ) {
      setExpanded(true);
    }
  }, [status, hasEntries, expanded, isRunningFocus]);

  // Terminal-quest rendering (autoExpand=true) auto-expands the row once entries
  // arrive — initial state computes before the WS replay delivers chat-output,
  // so the constructor sees hasEntries=false and would leave the row collapsed.
  // The userClickedRef gate keeps this from re-expanding after a manual collapse.
  useEffect(() => {
    if (autoExpand === true && hasEntries && !expanded && !userClickedRef.current) {
      setExpanded(true);
    }
  }, [autoExpand, hasEntries, expanded]);

  useEffect(() => {
    if (
      prevStatusRef.current === ('in_progress' as ExecutionStepStatus) &&
      status !== ('in_progress' as ExecutionStepStatus) &&
      status !== ('pending' as ExecutionStepStatus) &&
      !userClickedRef.current
    ) {
      setExpanded(false);
    }
    prevStatusRef.current = status;
    userClickedRef.current = false;
  }, [status]);

  const isRunning = status === ('in_progress' as ExecutionStepStatus);
  // The clock this row ticks against — the panel's reading while it runs, nothing once it stops,
  // so nothing on screen climbs for a row or a nested sub-agent chain that stopped hours ago. It
  // serves both the row's own elapsed figure and the transcript it forwards to. Resolved through a
  // transformer rather than inline: this arrow function sits at the `complexity: max 50` ceiling
  // `eslintRuleStatics` enforces, and a second inline copy of the test is what tips it over.
  const runningNow = runningRowNowTransformer({ isRunning, now });
  // A row shows a figure exactly when it has a startedAt AND an honest end point: completedAt if
  // it has one, else `now` while running. Any other status with a startedAt has none — that
  // startedAt is left over from a previous dispatch, not a span still in progress.
  const elapsedEndPoint = completedAt ?? runningNow;
  // The panel's shared tick re-renders EVERY visible row on EVERY tick (ExecutionRowLayerWidget is
  // not memoised, and now is threaded to every row regardless of status), so without this memo a
  // finished row would re-invoke elapsedPartsTransformer — and its two Date.prototype.getTime()
  // calls — on every tick right alongside the running rows whose figure actually needs to advance.
  // startedAt and elapsedEndPoint are the only two inputs the figure depends on, and for a finished
  // row elapsedEndPoint is its own completedAt, which never changes — so this dependency pair stays
  // Object.is-stable across every one of those extra renders and the factory below is skipped.
  const durationLabel = useMemo(
    () =>
      startedAt && elapsedEndPoint
        ? durationDisplayTransformer({
            elapsedParts: elapsedPartsTransformer({ startedAt, endedAt: elapsedEndPoint }),
          })
        : undefined,
    [startedAt, elapsedEndPoint],
  );
  const { statusLabel, statusColor, roleColor } = executionRowDisplayResolveTransformer({
    status,
    role,
    workItem,
  });
  const isExpandable = EXPANDABLE_STATUSES.includes(status) || hasEntries;
  const subtitle = executionRowSubtitleTransformer({ status, dependsOn, files });
  const headerContextLabel = computeRowContextTotalTransformer({ entries: entries ?? [] });

  return (
    <Box
      data-testid="execution-row-layer-widget"
      mb={ROW_MARGIN_BOTTOM}
      style={{
        ...(isAdhoc
          ? {
              borderLeft: `${ADHOC_BORDER_WIDTH}px dashed ${colors.warning}`,
              paddingLeft: ADHOC_PADDING_LEFT,
            }
          : { borderLeft: `${ADHOC_BORDER_WIDTH}px solid transparent`, paddingLeft: 0 }),
        marginLeft: indented === true ? CHILD_ROW_INDENT_LEFT : 0,
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
          // Pinned only while open — that is both when there is a transcript long enough to lose
          // the header off the top, and when the `bg-raised` fill above is present to keep the
          // entries scrolling underneath from reading through it. A collapsed row is one line with
          // nothing of its own to scroll past, and pinning a transparent bar would let the rows
          // below it show through.
          ...(expanded
            ? {
                backgroundColor: colors['bg-raised'],
                position: 'sticky' as const,
                top: Number(STICKY_TOP_ROOT),
                zIndex: Number(stickyHeaderZIndexTransformer({ stickyTop: STICKY_TOP_ROOT })),
                height: stickyHeaderStatics.heights.executionRow,
                boxSizing: 'border-box' as const,
              }
            : { backgroundColor: 'transparent' }),
        }}
      >
        <Text
          ff="monospace"
          data-testid="execution-row-chevron"
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

        {order === undefined ? null : (
          <Text
            ff="monospace"
            style={{
              fontSize: HEADER_FONT_SIZE,
              color: isAdhoc ? colors.warning : colors['text-dim'],
              width: ORDER_WIDTH,
              flexShrink: 0,
            }}
          >
            {String(order).padStart(ORDER_PAD_LENGTH, '0')}
          </Text>
        )}

        {indented === true ? null : (
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
        )}

        <Text
          ff="monospace"
          data-testid="execution-row-name"
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

        {attempt && maxAttempts !== undefined ? (
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

        <ExecutionRowMintedByBadgeLayerWidget mintedByLabel={mintedByLabel} />

        {durationLabel === undefined ? null : (
          <Text
            ff="monospace"
            data-testid="execution-row-duration"
            style={{
              fontSize: ADHOC_FONT_SIZE,
              color: colors['text-dim'],
              flexShrink: 0,
            }}
          >
            {durationLabel}
          </Text>
        )}

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
            color: colors[statusColor],
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {statusLabel}
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
          <ExecutionRowScopeChurnLayerWidget scopeWorkItems={scopeWorkItems} />
          <ExecutionRowUnitMarksLayerWidget workItem={workItem} />
          <ExecutionRowUnmetListLayerWidget workItem={workItem} />
          {inputContracts?.length ? (
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
          {outputContracts?.length ? (
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
          {actualSignal ? (
            <Box
              data-testid="execution-row-signals"
              style={{ marginBottom: EXPANDED_DETAIL_MARGIN_BOTTOM }}
            >
              <Text
                ff="monospace"
                data-testid="execution-row-actual-signal"
                style={{
                  fontSize: EXPANDED_DETAIL_FONT_SIZE,
                  color:
                    status === ('failed' as ExecutionStepStatus)
                      ? colors.danger
                      : colors['text-dim'],
                }}
              >
                Actual signal: {actualSignal}
              </Text>
            </Box>
          ) : null}
          {entries?.length ? (
            <ChatEntryListWidget
              entries={displayEntries}
              isStreaming={isStreaming ?? false}
              roleLabel={role}
              swapTrailingEmptyThinkingForIndicator={true}
              collapseToTail={true}
              // The tail window earns its keep only while output is still streaming in. A reader who
              // opens a finished row wants the whole transcript, sub-agent chains included; the
              // toggle stays rendered either way, so a long one can still be folded back down.
              defaultShowAllEarlier={!isRunning}
              stickyTop={STICKY_TOP_INSIDE_ROW}
              isCommandOutput={isCommandRow}
              {...(runningNow === undefined ? {} : { now: runningNow })}
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
          {wardResults?.length
            ? wardResults.map((wr) => (
                <WardResultRowLayerWidget
                  key={wr.id}
                  wardResult={wr}
                  {...(questId === undefined ? {} : { questId })}
                />
              ))
            : null}
          {riftcarverResults?.length
            ? riftcarverResults.map((rr) => (
                <RiftcarverResultRowLayerWidget
                  key={rr.id}
                  riftcarverResult={rr}
                  {...(questId === undefined ? {} : { questId })}
                />
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
