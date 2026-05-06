/**
 * PURPOSE: Wraps RxJS of() so consumers can produce a synchronous one-shot Observable from a value without taking a direct dependency on the rxjs package
 *
 * USAGE:
 * const stream = rxjsOfAdapter({ value: undefined });
 * stream.subscribe(() => fire());
 */

import type { Observable } from 'rxjs';
import { of } from 'rxjs';

export const rxjsOfAdapter = <T>({ value }: { value: T }): Observable<T> => of(value);
