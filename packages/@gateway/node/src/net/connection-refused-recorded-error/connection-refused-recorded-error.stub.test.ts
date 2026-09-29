import { ConnectionRefusedErrorStub } from '../connection-refused-error/connection-refused-error.stub';
import { ConnectionRefusedRecordedErrorStub } from './connection-refused-recorded-error.stub';

describe('ConnectionRefusedRecordedErrorStub', () => {
  it('VALID: {address and port of a real refused connection} => matches that error field for field', async () => {
    const real = await ConnectionRefusedErrorStub();
    const [address, port] = real.message.replace('connect ECONNREFUSED ', '').split(':');
    const recorded = ConnectionRefusedRecordedErrorStub({
      address: String(address),
      port: Number(port),
    });

    expect({
      message: recorded.message,
      code: recorded.code,
      errno: recorded.errno,
      syscall: recorded.syscall,
    }).toStrictEqual({
      message: real.message,
      code: real.code,
      errno: real.errno,
      syscall: real.syscall,
    });
  });

  it('EMPTY: {} => defaults to 127.0.0.1:4000 with the address and port fields set', () => {
    const recorded = ConnectionRefusedRecordedErrorStub();

    expect({
      message: recorded.message,
      address: recorded.address,
      port: recorded.port,
    }).toStrictEqual({
      message: 'connect ECONNREFUSED 127.0.0.1:4000',
      address: '127.0.0.1',
      port: 4000,
    });
  });
});
