import { resultsStatics } from '../../statics/results/results-statics';
import { sinceMarkerContract } from './since-marker-contract';
import type { SinceMarker } from './since-marker-contract';

export const SinceMarkerStub = (
  { value }: { value: string } = { value: resultsStatics.since.boot },
): SinceMarker => sinceMarkerContract.parse(value);
