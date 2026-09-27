/**
 * PURPOSE: A real `Observable`, built through the real `of()` — for a caller staging this
 * subpath's own value instead of hand-typing a fake one.
 *
 * USAGE:
 * const observable = ObservableStub();
 * // Returns a real Observable emitting the given value once, then completing
 */
import { of } from 'rxjs';
import type { Observable } from 'rxjs';

export const ObservableStub = ({
  value = 'gateway-stub-value',
}: { value?: string } = {}): Observable<string> => of(value);
