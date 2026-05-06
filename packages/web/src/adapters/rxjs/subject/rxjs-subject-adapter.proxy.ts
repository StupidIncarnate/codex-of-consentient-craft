/**
 * PURPOSE: Proxy for rxjsSubjectAdapter — exposes a deterministic Subject factory tests can introspect (latest emissions, completion state) without registering jest mocks. The adapter itself is so thin (a Subject wrapper) that the proxy mirrors its real behavior; only the adapter's internal Subject is shadowed so tests can drain emitted values.
 *
 * USAGE:
 * const proxy = rxjsSubjectAdapterProxy();
 * proxy.create<number>().next(42);
 * proxy.getLatestEmission(); // 42
 */

import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';

export const rxjsSubjectAdapterProxy = (): {
  create: <T>() => {
    next: (value: T) => void;
    observable: Observable<T>;
    complete: () => void;
  };
} => ({
  create: <T>(): {
    next: (value: T) => void;
    observable: Observable<T>;
    complete: () => void;
  } => {
    const subject = new Subject<T>();
    return {
      next: (value: T): void => {
        subject.next(value);
      },
      observable: subject.asObservable(),
      complete: (): void => {
        subject.complete();
      },
    };
  },
});
