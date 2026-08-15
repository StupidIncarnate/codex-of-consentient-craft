/**
 * PURPOSE: Fetches and renders the full persisted carve log for a single riftcarver result under an
 * expanded [RIFTCARVER] execution row. On mount it GETs the riftcarver detail blob for the
 * riftcarverResultId and splits it into display lines. Renders nothing while loading, on fetch error,
 * or when the log is empty — proving on reload that the persisted riftcarver-results/<id>.log renders,
 * not just the in-memory stream that evaporates on refresh.
 *
 * USAGE:
 * <RiftcarverResultDetailLayerWidget questId={questId} riftcarverResult={riftcarverResult} />
 */

import { Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import type { QuestId, RiftcarverResult } from '@dungeonmaster/shared/contracts';

import { questRiftcarverDetailBroker } from '../../brokers/quest/riftcarver-detail/quest-riftcarver-detail-broker';
import type { RiftcarverDetail } from '../../contracts/riftcarver-detail/riftcarver-detail-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { riftcarverLogToDisplayLinesTransformer } from '../../transformers/riftcarver-log-to-display-lines/riftcarver-log-to-display-lines-transformer';

const DETAIL_FONT_SIZE = 10;
const DETAIL_MARGIN_BOTTOM = 4;

export const RiftcarverResultDetailLayerWidget = ({
  questId,
  riftcarverResult,
}: {
  questId: QuestId;
  riftcarverResult: RiftcarverResult;
}): React.JSX.Element | null => {
  const { colors } = emberDepthsThemeStatics;
  const [detail, setDetail] = useState<RiftcarverDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    questRiftcarverDetailBroker({ questId, riftcarverResultId: riftcarverResult.id })
      .then((fetched) => {
        if (!cancelled) {
          setDetail(fetched);
        }
      })
      .catch((fetchError: unknown) => {
        globalThis.console.error('[riftcarver-result-detail] fetch failed', fetchError);
      });
    return (): void => {
      cancelled = true;
    };
  }, [questId, riftcarverResult.id]);

  const lines = riftcarverLogToDisplayLinesTransformer({ detail });

  if (lines.length === 0) {
    return null;
  }

  return (
    <Text
      ff="monospace"
      data-testid="execution-row-riftcarver-detail"
      style={{
        fontSize: DETAIL_FONT_SIZE,
        color: colors['text-dim'],
        marginBottom: DETAIL_MARGIN_BOTTOM,
        whiteSpace: 'pre-wrap',
      }}
    >
      {lines.join('\n')}
    </Text>
  );
};
