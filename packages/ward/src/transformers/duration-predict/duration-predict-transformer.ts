/**
 * PURPOSE: Computes median duration and peak RSS predictions per package and check type from historical samples.
 * Reach for this when scheduling package runs to estimate execution cost from history rather than dispatching
 * in arbitrary order.
 *
 * USAGE:
 * durationPredictTransformer({ samples: [DurationSampleStub()] });
 * // Returns Map of package name to Map of check type to predicted duration and peak RSS
 */

import type { DurationSample } from '../../contracts/duration-sample/duration-sample-contract';
import type { CheckType } from '../../contracts/check-type/check-type-contract';

export type DurationPrediction = Record<'durationMs', number> & Record<'peakRssMB', number | null>;

export type DurationPredictions = Map<string, Map<string, DurationPrediction>>;

export const durationPredictTransformer = ({
  samples,
}: {
  samples: readonly DurationSample[];
}): DurationPredictions => {
  const grouped = new Map<string, Map<CheckType, DurationSample[]>>();

  for (const sample of samples) {
    let checkMap = grouped.get(sample.packageName);
    if (!checkMap) {
      checkMap = new Map<CheckType, DurationSample[]>();
      grouped.set(sample.packageName, checkMap);
    }
    let list = checkMap.get(sample.checkType);
    if (!list) {
      list = [];
      checkMap.set(sample.checkType, list);
    }
    list.push(sample);
  }

  const predictions: DurationPredictions = new Map();
  const divisor = 1 + 1;

  for (const [packageName, checkMap] of grouped) {
    const packagePredictions = new Map<string, DurationPrediction>();
    for (const [checkType, sampleList] of checkMap) {
      const sortedDurations = sampleList
        .map((sample) => sample.durationMs)
        .sort((left, right) => left - right);
      const midDuration = Math.floor(sortedDurations.length / divisor);
      const medianDuration =
        sortedDurations.length % divisor === 1
          ? (sortedDurations[midDuration] ?? 0)
          : Math.round(
              ((sortedDurations[midDuration - 1] ?? 0) + (sortedDurations[midDuration] ?? 0)) /
                divisor,
            );

      const nonNullRssValues = sampleList
        .flatMap((sample) => (sample.peakRssMB === null ? [] : [sample.peakRssMB]))
        .sort((left, right) => left - right);

      const midRss = Math.floor(nonNullRssValues.length / divisor);
      const medianPeakRssMB =
        nonNullRssValues.length === 0
          ? null
          : nonNullRssValues.length % divisor === 1
            ? (nonNullRssValues[midRss] ?? null)
            : Math.round(
                ((nonNullRssValues[midRss - 1] ?? 0) + (nonNullRssValues[midRss] ?? 0)) / divisor,
              );

      packagePredictions.set(checkType, {
        durationMs: medianDuration,
        peakRssMB: medianPeakRssMB,
      });
    }
    predictions.set(packageName, packagePredictions);
  }

  return predictions;
};
