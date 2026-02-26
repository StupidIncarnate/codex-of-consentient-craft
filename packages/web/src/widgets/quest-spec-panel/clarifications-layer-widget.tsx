/**
 * PURPOSE: Renders a read-only display of quest clarifications showing questions, answers, and timestamps
 *
 * USAGE:
 * <ClarificationsLayerWidget clarifications={clarifications} />
 * // Renders each clarification with question text, user answer, and timestamp
 */

import { Box, Text } from '@mantine/core';

import type { QuestClarification } from '@dungeonmaster/shared/contracts';

import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { PlanSectionWidget } from '../plan-section/plan-section-widget';

const CLARIFICATIONS_LABEL = 'CLARIFICATIONS' as SectionLabel;
const HEADER_FONT_SIZE = 'xs' as const;
const LABEL_FONT_SIZE = 10;

const { colors } = emberDepthsThemeStatics;

export interface ClarificationsLayerWidgetProps {
  clarifications: QuestClarification[];
}

export const ClarificationsLayerWidget = ({
  clarifications,
}: ClarificationsLayerWidgetProps): React.JSX.Element => (
  <Box data-testid="CLARIFICATIONS_LAYER">
    <PlanSectionWidget
      title={CLARIFICATIONS_LABEL}
      items={clarifications}
      editing={false}
      renderItem={(clarification) => (
        <Box>
          {clarification.questions.map((q, qi) => (
            <Text
              key={String(qi)}
              ff="monospace"
              size={HEADER_FONT_SIZE}
              style={{ color: colors['text-dim'] }}
              data-testid="CLARIFICATION_QUESTION"
            >
              {q.question}
            </Text>
          ))}
          <Text
            ff="monospace"
            size={HEADER_FONT_SIZE}
            fw={600}
            style={{ color: colors.text }}
            data-testid="CLARIFICATION_ANSWER"
          >
            {clarification.answer}
          </Text>
          <Text
            ff="monospace"
            style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
            data-testid="CLARIFICATION_TIMESTAMP"
          >
            {clarification.timestamp}
          </Text>
        </Box>
      )}
    />
  </Box>
);
