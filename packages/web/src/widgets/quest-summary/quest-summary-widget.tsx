/**
 * PURPOSE: Renders one quest's verification summary as a pixel-art monospace panel — per-flow,
 * per-track sign-off counts; the observables added after approval and who added them; every
 * `unconfirmable` verdict with its reason text and its open question; and the side-channel notes
 * grouped by kind.
 *
 * USAGE:
 * <QuestSummaryWidget questId={quest.id} />
 * // Seeds from GET /api/quests/:questId/summary and repaints on that quest's quest-modified
 * // broadcasts, so a sign-off write lands here without a reload
 *
 * IT SHOWS WHAT `quest.status` DOES NOT. A quest reaches `complete` when its operations ledger
 * drains, not when its three tracks (codeweaver, flowrider, siegemaster) have SIGNED every unit,
 * and `unconfirmable` signs a unit exactly as `confirmed` does — so a complete quest can still
 * carry real holes, scope nobody approved, and unanswered questions. Every section here is one of
 * those blind spots, which is why an empty section renders its own "none" line rather than
 * disappearing: "nobody recorded any" and "nobody looked" must not read the same.
 */

import { Box, Text } from '@mantine/core';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { useQuestSummaryBinding } from '../../bindings/use-quest-summary/use-quest-summary-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FlowRowLayerWidget } from './flow-row-layer-widget';
import { NoteGroupLayerWidget } from './note-group-layer-widget';
import { ObservableRowLayerWidget } from './observable-row-layer-widget';
import { UnconfirmableRowLayerWidget } from './unconfirmable-row-layer-widget';

export interface QuestSummaryWidgetProps {
  questId: QuestId;
}

const TITLE_FONT_SIZE = 11;
const ROW_FONT_SIZE = 10;
const PANEL_PADDING = 8;
const SECTION_GAP = 10;
const ROW_INDENT = 10;

export const QuestSummaryWidget = ({ questId }: QuestSummaryWidgetProps): React.JSX.Element => {
  const { data, error } = useQuestSummaryBinding({ questId });
  const { colors } = emberDepthsThemeStatics;

  if (error !== null) {
    return (
      <Box
        data-testid="QUEST_SUMMARY_ERROR"
        style={{
          fontFamily: 'monospace',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors['bg-surface'],
          padding: PANEL_PADDING,
        }}
      >
        <Text ff="monospace" style={{ fontSize: ROW_FONT_SIZE, color: colors.danger }}>
          VERIFICATION SUMMARY UNREADABLE — {error.message}
        </Text>
      </Box>
    );
  }

  if (data === null) {
    return (
      <Box
        data-testid="QUEST_SUMMARY_LOADING"
        style={{
          fontFamily: 'monospace',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors['bg-surface'],
          padding: PANEL_PADDING,
        }}
      >
        <Text ff="monospace" style={{ fontSize: ROW_FONT_SIZE, color: colors['text-dim'] }}>
          Reading verification summary...
        </Text>
      </Box>
    );
  }

  return (
    <Box
      data-testid="QUEST_SUMMARY"
      style={{
        fontFamily: 'monospace',
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors['bg-surface'],
        padding: PANEL_PADDING,
        display: 'flex',
        flexDirection: 'column',
        gap: SECTION_GAP,
      }}
    >
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_TITLE"
        style={{ fontSize: TITLE_FONT_SIZE, color: colors.primary, fontWeight: 600 }}
      >
        ▛ VERIFICATION SUMMARY
      </Text>

      <Box data-testid="QUEST_SUMMARY_SECTION_COVERAGE">
        <Text
          ff="monospace"
          data-testid="QUEST_SUMMARY_SECTION_TITLE"
          style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-gold'], fontWeight: 600 }}
        >
          COVERAGE
        </Text>
        {data.flows.length === 0 ? (
          <Text
            ff="monospace"
            data-testid="QUEST_SUMMARY_COVERAGE_EMPTY"
            style={{ fontSize: ROW_FONT_SIZE, color: colors['text-dim'], paddingLeft: ROW_INDENT }}
          >
            no flows on this quest
          </Text>
        ) : (
          data.flows.map((flow) => <FlowRowLayerWidget key={flow.id} flow={flow} />)
        )}
      </Box>

      <Box data-testid="QUEST_SUMMARY_SECTION_DRIFT">
        <Text
          ff="monospace"
          data-testid="QUEST_SUMMARY_SECTION_TITLE"
          style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-gold'], fontWeight: 600 }}
        >
          ADDED MID-QUEST
        </Text>
        {data.midQuestObservables.length === 0 ? (
          <Text
            ff="monospace"
            data-testid="QUEST_SUMMARY_DRIFT_EMPTY"
            style={{ fontSize: ROW_FONT_SIZE, color: colors['text-dim'], paddingLeft: ROW_INDENT }}
          >
            nothing added after approval
          </Text>
        ) : (
          data.midQuestObservables.map((observable) => (
            <ObservableRowLayerWidget key={observable.id} observable={observable} />
          ))
        )}
      </Box>

      <Box data-testid="QUEST_SUMMARY_SECTION_DEBT">
        <Text
          ff="monospace"
          data-testid="QUEST_SUMMARY_SECTION_TITLE"
          style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-gold'], fontWeight: 600 }}
        >
          UNCONFIRMABLE
        </Text>
        {data.unconfirmable.length === 0 ? (
          <Text
            ff="monospace"
            data-testid="QUEST_SUMMARY_DEBT_EMPTY"
            style={{ fontSize: ROW_FONT_SIZE, color: colors['text-dim'], paddingLeft: ROW_INDENT }}
          >
            no unconfirmable verdicts
          </Text>
        ) : (
          data.unconfirmable.map((entry) => (
            <UnconfirmableRowLayerWidget key={entry.id} entry={entry} />
          ))
        )}
      </Box>

      <Box data-testid="QUEST_SUMMARY_SECTION_NOTES">
        <Text
          ff="monospace"
          data-testid="QUEST_SUMMARY_SECTION_TITLE"
          style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-gold'], fontWeight: 600 }}
        >
          NOTES
        </Text>
        {data.noteGroups.map((group) => (
          <NoteGroupLayerWidget key={group.id} group={group} />
        ))}
      </Box>
    </Box>
  );
};
