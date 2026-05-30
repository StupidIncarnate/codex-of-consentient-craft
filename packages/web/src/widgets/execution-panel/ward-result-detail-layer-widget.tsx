/**
 * PURPOSE: Fetches and renders the lint/typecheck/test failure breakdown for a single ward result
 * under an expanded [WARD] execution row. On mount it GETs the ward detail blob for the wardResultId
 * and flattens it into one line per failure. Renders nothing while loading, on fetch error, or when
 * there are no failures to show.
 *
 * USAGE:
 * <WardResultDetailLayerWidget questId={questId} wardResult={wardResult} />
 */

import { Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import type { QuestId, WardResult } from '@dungeonmaster/shared/contracts';

import { questWardDetailBroker } from '../../brokers/quest/ward-detail/quest-ward-detail-broker';
import type { WardDetail } from '../../contracts/ward-detail/ward-detail-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { wardDetailToDisplayLinesTransformer } from '../../transformers/ward-detail-to-display-lines/ward-detail-to-display-lines-transformer';

const DETAIL_FONT_SIZE = 10;
const DETAIL_MARGIN_BOTTOM = 4;

export const WardResultDetailLayerWidget = ({
  questId,
  wardResult,
}: {
  questId: QuestId;
  wardResult: WardResult;
}): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  const [detail, setDetail] = useState<WardDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    questWardDetailBroker({ questId, wardResultId: wardResult.id })
      .then((fetched) => {
        if (!cancelled) {
          setDetail(fetched);
        }
      })
      .catch((fetchError: unknown) => {
        globalThis.console.error('[ward-result-detail] fetch failed', fetchError);
      });
    return (): void => {
      cancelled = true;
    };
  }, [questId, wardResult.id]);

  const lines = wardDetailToDisplayLinesTransformer({ detail });

  if (lines.length === 0) {
    return null;
  }

  return (
    <Text
      ff="monospace"
      data-testid="execution-row-ward-detail"
      style={{
        fontSize: DETAIL_FONT_SIZE,
        color: colors.danger,
        marginBottom: DETAIL_MARGIN_BOTTOM,
        whiteSpace: 'pre-wrap',
      }}
    >
      {lines.join('\n')}
    </Text>
  );
};
