import {
  PortFreeTeardownCheckStub,
  ProcessGoneTeardownCheckStub,
} from '../../../contracts/smoketest-teardown-check/smoketest-teardown-check.stub';
import { smoketestRunTeardownChecksBroker } from './smoketest-run-teardown-checks-broker';
import { smoketestRunTeardownChecksBrokerProxy } from './smoketest-run-teardown-checks-broker.proxy';

const portCheck = PortFreeTeardownCheckStub({ port: 4751 });
// 4_999_999 is above Linux's default pid_max (4194304), so process.kill(pid, 0) raises ESRCH reliably.
const deadProcessCheck = ProcessGoneTeardownCheckStub({ pid: 4_999_999 });
const alivePidProcessCheck = ProcessGoneTeardownCheckStub({ pid: process.pid });

describe('smoketestRunTeardownChecksBroker', () => {
  describe('all checks pass', () => {
    it('VALID: {port free and process gone} => returns passed with empty failures', async () => {
      const proxy = smoketestRunTeardownChecksBrokerProxy();
      proxy.setupPortFree();

      const result = await smoketestRunTeardownChecksBroker({
        checks: [portCheck, deadProcessCheck],
      });

      expect(result).toStrictEqual({ passed: true, failures: [] });
    });
  });

  describe('port still in use', () => {
    it('INVALID: {port still bound} => returns failures containing the port check', async () => {
      const proxy = smoketestRunTeardownChecksBrokerProxy();
      proxy.setupPortInUse();

      const result = await smoketestRunTeardownChecksBroker({
        checks: [portCheck],
      });

      expect(result).toStrictEqual({ passed: false, failures: [portCheck] });
    });
  });

  describe('process still alive', () => {
    it('INVALID: {current test-runner pid} => returns failures containing the process check', async () => {
      smoketestRunTeardownChecksBrokerProxy();

      const result = await smoketestRunTeardownChecksBroker({
        checks: [alivePidProcessCheck],
      });

      expect(result).toStrictEqual({ passed: false, failures: [alivePidProcessCheck] });
    });
  });

  describe('mixed pass/fail preserves input order', () => {
    it('INVALID: {port free but current-runner pid alive} => failures contain only the process check in original order', async () => {
      const proxy = smoketestRunTeardownChecksBrokerProxy();
      proxy.setupPortFree();

      const result = await smoketestRunTeardownChecksBroker({
        checks: [portCheck, alivePidProcessCheck],
      });

      expect(result).toStrictEqual({ passed: false, failures: [alivePidProcessCheck] });
    });
  });

  describe('empty checks list', () => {
    it('VALID: {no checks} => returns passed with empty failures', async () => {
      smoketestRunTeardownChecksBrokerProxy();

      const result = await smoketestRunTeardownChecksBroker({ checks: [] });

      expect(result).toStrictEqual({ passed: true, failures: [] });
    });
  });
});
