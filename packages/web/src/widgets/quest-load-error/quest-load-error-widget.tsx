/**
 * PURPOSE: Renders the quest route's load-failure surface — the quest folder, an UNREADABLE marker and the server's field-level reason — so a quest.json the contract rejects reads as a diagnosable error rather than an empty workspace.
 *
 * USAGE:
 * <QuestLoadErrorWidget questId={questId} reason={reason} />
 * // Renders QUEST_LOAD_ERROR with QUEST_LOAD_ERROR_REASON carrying the message verbatim.
 *
 * Visual language matches the UNREADABLE quest row homebase already shows for the same class of
 * failure, so one malformed quest.json looks the same wherever the reader meets it.
 */

import { Box, Group } from '@mantine/core';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { ErrorBody } from '../../contracts/error-body/error-body-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const ROW_FONT_SIZE = 11;
const DETAIL_FONT_SIZE = 9;

export interface QuestLoadErrorWidgetProps {
  questId: QuestId;
  reason: ErrorBody['error'];
}

export const QuestLoadErrorWidget = ({
  questId,
  reason,
}: QuestLoadErrorWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      data-testid="QUEST_LOAD_ERROR"
      px="xs"
      py={6}
      style={{
        fontFamily: 'monospace',
        fontSize: ROW_FONT_SIZE,
        color: colors.text,
        borderRadius: 2,
        borderLeft: `2px solid ${colors.danger}`,
        backgroundColor: colors['bg-raised'],
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <Group gap={6} wrap="nowrap" justify="space-between">
        <span
          data-testid="QUEST_LOAD_ERROR_FILE"
          style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}
        >
          {`${String(questId)}/quest.json`}
        </span>
        <span style={{ color: colors.danger, fontSize: DETAIL_FONT_SIZE, flexShrink: 0 }}>
          UNREADABLE
        </span>
      </Group>
      <span
        data-testid="QUEST_LOAD_ERROR_REASON"
        style={{
          color: colors['text-dim'],
          fontSize: DETAIL_FONT_SIZE,
          overflowWrap: 'anywhere',
        }}
      >
        {reason}
      </span>
      <span style={{ color: colors['text-dim'], fontSize: DETAIL_FONT_SIZE }}>
        Fix the named field in this quest.json, then reload.
      </span>
    </Box>
  );
};
