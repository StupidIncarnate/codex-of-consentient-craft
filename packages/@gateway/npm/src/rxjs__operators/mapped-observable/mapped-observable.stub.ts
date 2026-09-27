/**
 * PURPOSE: A real, mapped `Observable`, built by actually piping `rxjs/operators`'s own `map()`
 * onto a real `of()` source — never a hand-typed emission standing in for what the real operator
 * would produce.
 *
 * USAGE:
 * const observable = MappedObservableStub();
 * // Returns a real Observable that doubles the given value
 */
import { of } from 'rxjs';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const MappedObservableStub = ({ value = 1 }: { value?: number } = {}): Observable<number> =>
  of(value).pipe(map((current) => current * 2));
