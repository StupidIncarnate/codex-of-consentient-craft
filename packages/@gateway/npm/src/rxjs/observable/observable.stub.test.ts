import { ObservableStub } from './observable.stub';

describe('ObservableStub', () => {
  it('VALID: {} => a real Observable that emits the default value once, then completes', () => {
    const emitted: string[] = [];
    let completed = false;

    ObservableStub().subscribe({
      next: (value) => emitted.push(value),
      complete: () => {
        completed = true;
      },
    });

    expect({ emitted, completed }).toStrictEqual({
      emitted: ['gateway-stub-value'],
      completed: true,
    });
  });
});
