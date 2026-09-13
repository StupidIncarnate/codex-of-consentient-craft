/**
 * PURPOSE: Renders one row of `QuestQueueBarWidget`'s expanded list — a single-line Link summarizing
 * position, guild slug, and title, with an error dot when the entry failed. Pulled out of the
 * parent's `.map` because `@dungeonmaster/ban-anonymous-jsx-in-map` refuses a callback that declares
 * row-local consts and returns a multi-child tree; a named leaf widget is what the map calls instead.
 *
 * USAGE:
 * <QueueRowLayerWidget entry={entry} index={arrayIndexContract.parse(0)} total={totalCountContract.parse(2)} isActive={true} />
 * // Renders a Link row: loot-gold text + raised background when isActive, an error dot when
 * // entry.error is set
 */

import { Link } from 'react-router-dom';

import type { ArrayIndex, QuestQueueEntry, TotalCount } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const ERROR_BADGE_SIZE = 10;
const CHEVRON_SIZE = 14;
const BORDER_WIDTH = 1;
const ROW_FONT_SIZE = 13;
const ROW_PADDING_Y = 6;
const ROW_PADDING_X = 12;

export interface QueueRowLayerWidgetProps {
  entry: QuestQueueEntry;
  index: ArrayIndex;
  total: TotalCount;
  isActive: boolean;
}

export const QueueRowLayerWidget = ({
  entry,
  index,
  total,
  isActive,
}: QueueRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const rowHasError = entry.error !== undefined;
  const href = `/${entry.guildSlug}/quest/${entry.questId}`;
  const rowLabel = `${index + 1}/${total} — ${entry.guildSlug} / ${entry.questTitle}`;

  return (
    <Link
      to={href}
      data-testid={`QUEST_QUEUE_BAR_ROW_${entry.questId.toUpperCase()}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: `${ROW_PADDING_Y}px ${ROW_PADDING_X}px`,
        color: isActive ? colors['loot-gold'] : colors.text,
        backgroundColor: isActive ? colors['bg-raised'] : 'transparent',
        borderLeft: `${BORDER_WIDTH}px solid ${isActive ? colors['loot-gold'] : 'transparent'}`,
        fontFamily: 'monospace',
        fontSize: ROW_FONT_SIZE,
        textDecoration: 'none',
      }}
    >
      {rowHasError ? (
        <span
          data-testid={`QUEST_QUEUE_BAR_ROW_ERROR_${entry.questId.toUpperCase()}`}
          aria-label="Entry error"
          title={entry.error?.message ?? ''}
          style={{
            display: 'inline-block',
            width: ERROR_BADGE_SIZE,
            height: ERROR_BADGE_SIZE,
            borderRadius: ERROR_BADGE_SIZE,
            backgroundColor: colors.danger,
            marginRight: CHEVRON_SIZE - ERROR_BADGE_SIZE,
          }}
        />
      ) : null}
      <span>{rowLabel}</span>
    </Link>
  );
};
