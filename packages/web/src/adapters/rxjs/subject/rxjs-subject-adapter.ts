/**
 * PURPOSE: Wraps RxJS Subject construction so the rest of the codebase can compose reactive streams without taking a direct dependency on the rxjs package's class constructors
 *
 * USAGE:
 * const subject = rxjsSubjectAdapter<MyPayload>();
 * subject.next(payload);
 * const sub = subject.observable.subscribe((p) => handle(p));
 * sub.unsubscribe();
 */

import { Subject } from 'rxjs';
import type { Observable } from 'rxjs';

export const rxjsSubjectAdapter = <T>(): {
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
};
