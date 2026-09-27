import { MappedObservableStub } from './mapped-observable.stub';

describe('MappedObservableStub', () => {
  it('VALID: {} => a real Observable that doubles the default value', () => {
    const emitted: number[] = [];

    MappedObservableStub().subscribe((value) => emitted.push(value));

    expect(emitted).toStrictEqual([2]);
  });

  it('VALID: {value} => doubles the given value', () => {
    const emitted: number[] = [];

    MappedObservableStub({ value: 5 }).subscribe((value) => emitted.push(value));

    expect(emitted).toStrictEqual([10]);
  });
});
