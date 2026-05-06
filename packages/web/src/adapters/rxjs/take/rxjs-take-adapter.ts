/**
 * PURPOSE: Wraps RxJS take() so consumers can complete an Observable after N emissions without taking a direct dependency on the rxjs package
 *
 * USAGE:
 * const onceOnly = rxjsTakeAdapter({ source: stream, count: 1 });
 * onceOnly.subscribe((value) => handleOnce(value));
 */

import type { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { takeCountContract } from '../../../contracts/take-count/take-count-contract';
import type { TakeCount } from '../../../contracts/take-count/take-count-contract';

export const rxjsTakeAdapter = <T>({
  source,
  count,
}: {
  source: Observable<T>;
  count: TakeCount;
}): Observable<T> => source.pipe(take(takeCountContract.parse(count)));
