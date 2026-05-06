/**
 * PURPOSE: Wraps RxJS merge() so consumers can compose multiple Observables into a single output stream without taking a direct dependency on the rxjs package
 *
 * USAGE:
 * const combined = rxjsMergeAdapter({ sources: [observableA, observableB] });
 * combined.subscribe((value) => handle(value));
 */

import type { Observable } from 'rxjs';
import { merge } from 'rxjs';

export const rxjsMergeAdapter = <T>({
  sources,
}: {
  sources: readonly Observable<T>[];
}): Observable<T> => merge(...sources);
