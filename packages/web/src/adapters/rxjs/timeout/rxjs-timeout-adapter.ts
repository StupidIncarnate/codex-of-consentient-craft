/**
 * PURPOSE: Wraps RxJS timeout() so consumers can apply a per-emission timeout to an Observable without taking a direct dependency on the rxjs package
 *
 * USAGE:
 * const guarded = rxjsTimeoutAdapter({ source: stream, durationMs: TimeoutMsStub({ value: 30000 }) });
 * guarded.subscribe({ next: handle, error: onTimeout });
 */

import type { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';

export const rxjsTimeoutAdapter = <T>({
  source,
  durationMs,
}: {
  source: Observable<T>;
  durationMs: TimeoutMs;
}): Observable<T> => source.pipe(timeout({ first: timeoutMsContract.parse(durationMs) }));
