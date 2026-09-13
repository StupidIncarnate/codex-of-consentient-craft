/**
 * PURPOSE: Renders one row of `QueuePageWidget`'s list — position, title, status, and guild slug as
 * separate labeled spans, plus an error dot when the entry failed. Pulled out of the parent's `.map`
 * because `@dungeonmaster/ban-anonymous-jsx-in-map` refuses a callback that declares row-local consts
 * and returns a multi-child tree; a named leaf widget is what the map calls instead.
 *
 * USAGE:
 * <QueueRowLayerWidget entry={entry} index={arrayIndexContract.parse(0)} total={totalCountContract.parse(2)} isActive={true} />
 * // Renders a Link row with four labeled fields and an error dot when entry.error is set
 */

import { Link } from 'react-router-dom';

import type { ArrayIndex, QuestQueueEntry, TotalCount } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const ERROR_BADGE_SIZE = 10;
const BORDER_WIDTH = 1;
const ROW_FONT_SIZE = 13;
const ROW_PADDING_Y = 8;
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

  return (
    <Link
      to={href}
      data-testid={`QUEUE_PAGE_ROW_${entry.questId.toUpperCase()}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: `${ROW_PADDING_Y}px ${ROW_PADDING_X}px`,
        color: isActive ? colors['loot-gold'] : colors.text,
        backgroundColor: isActive ? colors['bg-raised'] : 'transparent',
        borderLeft: `${BORDER_WIDTH}px solid ${isActive ? colors['loot-gold'] : 'transparent'}`,
        borderBottom: `${BORDER_WIDTH}px solid ${colors.border}`,
        fontFamily: 'monospace',
        fontSize: ROW_FONT_SIZE,
        textDecoration: 'none',
      }}
    >
      <span data-testid={`QUEUE_PAGE_ROW_POSITION_${entry.questId.toUpperCase()}`}>
        {`${index + 1}/${total}`}
      </span>
      <span data-testid={`QUEUE_PAGE_ROW_TITLE_${entry.questId.toUpperCase()}`}>
        {entry.questTitle}
      </span>
      <span
        data-testid={`QUEUE_PAGE_ROW_STATUS_${entry.questId.toUpperCase()}`}
        style={{ color: colors['text-dim'] }}
      >
        {entry.status}
      </span>
      <span
        data-testid={`QUEUE_PAGE_ROW_GUILD_${entry.questId.toUpperCase()}`}
        style={{ color: colors['text-dim'] }}
      >
        {entry.guildSlug}
      </span>
      {rowHasError ? (
        <span
          data-testid={`QUEUE_PAGE_ROW_ERROR_${entry.questId.toUpperCase()}`}
          aria-label="Entry error"
          title={entry.error?.message ?? ''}
          style={{
            display: 'inline-block',
            width: ERROR_BADGE_SIZE,
            height: ERROR_BADGE_SIZE,
            borderRadius: ERROR_BADGE_SIZE,
            backgroundColor: colors.danger,
          }}
        />
      ) : null}
    </Link>
  );
};
