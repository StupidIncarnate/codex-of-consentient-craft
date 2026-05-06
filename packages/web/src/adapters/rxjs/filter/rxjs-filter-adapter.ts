/**
 * PURPOSE: Wraps RxJS filter() so consumers can apply a typed predicate to an Observable without taking a direct dependency on the rxjs package
 *
 * USAGE:
 * const filtered = rxjsFilterAdapter({ source: stream, predicate: (p) => p.questId === activeId });
 * filtered.subscribe(handle);
 */

import type { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export const rxjsFilterAdapter = <T>({
  source,
  predicate,
}: {
  source: Observable<T>;
  predicate: (value: T) => boolean;
}): Observable<T> => source.pipe(filter(predicate));
