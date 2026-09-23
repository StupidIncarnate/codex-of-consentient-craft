/**
 * PURPOSE: The end-of-quest human-check section of the verification summary — every observable
 * flagged `verifyByHuman` across the quest's flows, each carrying its recorded verdict when a
 * `human-verdict` note names it by `unitId`, or MET / NOT MET controls when it does not.
 *
 * USAGE:
 * <HumanCheckPanelLayerWidget questId={quest.id} criteria={criteria} notes={notes} />
 * // criteria: every verifyByHuman-flagged observable; notes: the quest's `human-verdict` notes
 *
 * RENDERS NOTHING WHEN `criteria` IS EMPTY, unlike every sibling section here. Every other section
 * answers a blind spot `quest.status` cannot show and so renders its own "none of these" line even
 * when empty — but most quests carry no `verifyByHuman` criterion at all, and a section that reads
 * "no criteria" on every ordinary quest is noise the other sections do not have.
 *
 * MATCHING IS BY `unitId`, THE RAW OBSERVABLE ID. `note.unitId` and `criterion.observableId` are two
 * DIFFERENT brands over the same plain string, so `String()` on both sides is required —
 * `questHumanVerdictRecordBroker` (orchestrator) compares the same way, against the same id.
 */

import { Box, Text } from '@mantine/core';

import type { QuestId, QuestNote, QuestSummaryObservable } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { HumanCheckRowLayerWidget } from './human-check-row-layer-widget';

const ROW_FONT_SIZE = 10;

export interface HumanCheckPanelLayerWidgetProps {
  questId: QuestId;
  criteria: readonly QuestSummaryObservable[];
  notes: readonly QuestNote[];
}

export const HumanCheckPanelLayerWidget = ({
  questId,
  criteria,
  notes,
}: HumanCheckPanelLayerWidgetProps): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;

  if (criteria.length === 0) {
    return null;
  }

  return (
    <Box data-testid="QUEST_SUMMARY_SECTION_HUMAN_CHECK">
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_SECTION_TITLE"
        style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-gold'], fontWeight: 600 }}
      >
        HUMAN CHECK
      </Text>
      {criteria.map((criterion) => (
        <HumanCheckRowLayerWidget
          key={criterion.id}
          questId={questId}
          criterion={criterion}
          note={
            notes.find(
              (candidate) => String(candidate.unitId) === String(criterion.observableId),
            ) ?? null
          }
        />
      ))}
    </Box>
  );
};
