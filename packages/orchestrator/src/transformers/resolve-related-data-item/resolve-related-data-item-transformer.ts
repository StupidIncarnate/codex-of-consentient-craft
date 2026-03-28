/**
 * PURPOSE: Parse relatedDataItem string and resolve to the quest-level object
 *
 * USAGE:
 * resolveRelatedDataItemTransformer({ ref: 'steps/step-uuid', quest });
 * // Returns: { collection: 'steps', id: 'step-uuid', item: DependencyStep }
 */

import type { Quest, RelatedDataItem } from '@dungeonmaster/shared/contracts';

import type { ResolvedItem } from '../../contracts/resolved-related-data-item/resolved-related-data-item-contract';

export const resolveRelatedDataItemTransformer = ({
  ref,
  quest,
}: {
  ref: RelatedDataItem;
  quest: Quest;
}): ResolvedItem => {
  const refStr = String(ref);
  const slashIndex = refStr.indexOf('/');
  const collection = refStr.slice(0, slashIndex);
  const id = refStr.slice(slashIndex + 1);

  if (collection === 'steps') {
    const item = quest.steps.find((step) => String(step.id) === id);
    if (!item) {
      throw new Error(`Step ${id} not found in quest ${String(quest.id)}`);
    }
    return { collection: 'steps', id: item.id, item };
  }

  if (collection === 'wardResults') {
    const item = quest.wardResults.find((wr) => String(wr.id) === id);
    if (!item) {
      throw new Error(`WardResult ${id} not found in quest ${String(quest.id)}`);
    }
    return { collection: 'wardResults', id: item.id, item };
  }

  if (collection === 'flows') {
    const item = quest.flows.find((flow) => String(flow.id) === id);
    if (!item) {
      throw new Error(`Flow ${id} not found in quest ${String(quest.id)}`);
    }
    return { collection: 'flows', id: item.id, item };
  }

  throw new Error(`Unknown collection: ${collection}`);
};
