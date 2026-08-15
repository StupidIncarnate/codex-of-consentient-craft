import { permissionDeniedErrorStatics } from './permission-denied-error-statics';

describe('permissionDeniedErrorStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(permissionDeniedErrorStatics).toStrictEqual({
      markers: ['EACCES', 'EPERM', 'permission denied', 'Operation not permitted'],
    });
  });
});
