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

export interface QuestSummaryWidgetProps {
  questId: QuestId;
}

const TITLE_FONT_SIZE = 11;
const ROW_FONT_SIZE = 10;
const PANEL_PADDING = 8;
const SECTION_GAP = 10;
const ROW_GAP = 6;
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
          data.flows.map((flow) => (
            <Box key={flow.id} data-testid="QUEST_SUMMARY_FLOW_ROW" style={{ marginTop: ROW_GAP }}>
              <Text
                ff="monospace"
                data-testid="QUEST_SUMMARY_FLOW_NAME"
                style={{ fontSize: ROW_FONT_SIZE, color: colors.text, fontWeight: 600 }}
              >
                {flow.name} [{flow.flowType}]
              </Text>
              {flow.tracks.map((track) => (
                <Box
                  key={track.id}
                  data-testid="QUEST_SUMMARY_TRACK_ROW"
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: ROW_GAP,
                    paddingLeft: ROW_INDENT,
                  }}
                >
                  <Text
                    ff="monospace"
                    data-testid="QUEST_SUMMARY_TRACK_NAME"
                    style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-rare'], flexShrink: 0 }}
                  >
                    {track.id.toUpperCase()}
                  </Text>
                  <Text
                    ff="monospace"
                    data-testid="QUEST_SUMMARY_TRACK_CONFIRMED"
                    style={{ fontSize: ROW_FONT_SIZE, color: colors.success, flexShrink: 0 }}
                  >
                    {track.confirmed} confirmed
                  </Text>
                  <Text
                    ff="monospace"
                    data-testid="QUEST_SUMMARY_TRACK_UNCONFIRMABLE"
                    style={{ fontSize: ROW_FONT_SIZE, color: colors.warning, flexShrink: 0 }}
                  >
                    {track.unconfirmable} unconfirmable
                  </Text>
                  <Text
                    ff="monospace"
                    data-testid="QUEST_SUMMARY_TRACK_OUTSTANDING"
                    style={{ fontSize: ROW_FONT_SIZE, color: colors['text-dim'], flexShrink: 0 }}
                  >
                    {track.outstanding} outstanding
                  </Text>
                </Box>
              ))}
            </Box>
          ))
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
            <Box
              key={observable.id}
              data-testid="QUEST_SUMMARY_OBSERVABLE_ROW"
              style={{ paddingLeft: ROW_INDENT, marginTop: ROW_GAP }}
            >
              <Text
                ff="monospace"
                data-testid="QUEST_SUMMARY_OBSERVABLE_ADDED_BY"
                style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-rare'], fontWeight: 600 }}
              >
                added by {observable.addedBy}
              </Text>
              <Text
                ff="monospace"
                data-testid="QUEST_SUMMARY_OBSERVABLE_ANCHOR"
                style={{ fontSize: ROW_FONT_SIZE, color: colors['text-dim'] }}
              >
                {observable.flowId} / {observable.nodeId} [{observable.observableType}]
              </Text>
              <Text
                ff="monospace"
                data-testid="QUEST_SUMMARY_OBSERVABLE_DESCRIPTION"
                style={{ fontSize: ROW_FONT_SIZE, color: colors.text }}
              >
                {observable.description}
              </Text>
            </Box>
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
            <Box
              key={entry.id}
              data-testid="QUEST_SUMMARY_UNCONFIRMABLE_ROW"
              style={{ paddingLeft: ROW_INDENT, marginTop: ROW_GAP }}
            >
              <Text
                ff="monospace"
                data-testid="QUEST_SUMMARY_UNCONFIRMABLE_UNIT"
                style={{ fontSize: ROW_FONT_SIZE, color: colors.warning, fontWeight: 600 }}
              >
                [{entry.track}] {entry.unitId}
              </Text>
              <Text
                ff="monospace"
                data-testid="QUEST_SUMMARY_UNCONFIRMABLE_REASON"
                style={{ fontSize: ROW_FONT_SIZE, color: colors.text }}
              >
                {entry.signoff.evidence}
              </Text>
              {/* `question` is required by the contract on this verdict, but it is optional on the
                  Signoff shape itself, so the absent case renders nothing rather than an empty row. */}
              {entry.signoff.question === undefined ? null : (
                <Text
                  ff="monospace"
                  data-testid="QUEST_SUMMARY_UNCONFIRMABLE_QUESTION"
                  style={{ fontSize: ROW_FONT_SIZE, color: colors.primary }}
                >
                  ? {entry.signoff.question}
                </Text>
              )}
            </Box>
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
          <Box
            key={group.id}
            data-testid="QUEST_SUMMARY_NOTE_GROUP"
            style={{ paddingLeft: ROW_INDENT, marginTop: ROW_GAP }}
          >
            <Text
              ff="monospace"
              data-testid="QUEST_SUMMARY_NOTE_GROUP_TITLE"
              style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-rare'], fontWeight: 600 }}
            >
              {group.id.toUpperCase()} ({group.notes.length})
            </Text>
            {group.notes.map((note) => (
              <Box key={note.id} data-testid="QUEST_SUMMARY_NOTE_ROW">
                <Text
                  ff="monospace"
                  data-testid="QUEST_SUMMARY_NOTE_SUMMARY"
                  style={{ fontSize: ROW_FONT_SIZE, color: colors.text }}
                >
                  {note.summary}
                </Text>
                <Text
                  ff="monospace"
                  data-testid="QUEST_SUMMARY_NOTE_DETAIL"
                  style={{ fontSize: ROW_FONT_SIZE, color: colors['text-dim'] }}
                >
                  {note.role} — {note.detail}
                </Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
