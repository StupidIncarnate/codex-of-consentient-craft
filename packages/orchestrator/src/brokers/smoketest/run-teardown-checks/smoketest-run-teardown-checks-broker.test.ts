import {
  PortFreeTeardownCheckStub,
  ProcessGoneTeardownCheckStub,
} from '../../../contracts/smoketest-teardown-check/smoketest-teardown-check.stub';
import { smoketestRunTeardownChecksBroker } from './smoketest-run-teardown-checks-broker';
import { smoketestRunTeardownChecksBrokerProxy } from './smoketest-run-teardown-checks-broker.proxy';

const PORT = 4751;
const portCheck = PortFreeTeardownCheckStub({ port: PORT });
const DEAD_PID = 4_999_999;
const ALIVE_PID = 4_753;
const deadProcessCheck = ProcessGoneTeardownCheckStub({ pid: DEAD_PID });
const alivePidProcessCheck = ProcessGoneTeardownCheckStub({ pid: ALIVE_PID });

describe('smoketestRunTeardownChecksBroker', () => {
  describe('all checks pass', () => {
    it('VALID: {port free and process gone} => returns passed with empty failures', async () => {
      const proxy = smoketestRunTeardownChecksBrokerProxy();
      proxy.setupPortFree({ port: PORT });
      proxy.setupProcessGone({ pid: DEAD_PID });

      const result = await smoketestRunTeardownChecksBroker({
        checks: [portCheck, deadProcessCheck],
      });

      expect(result).toStrictEqual({ passed: true, failures: [] });
    });
  });

  describe('port still in use', () => {
    it('INVALID: {port still bound} => returns failures containing the port check', async () => {
      const proxy = smoketestRunTeardownChecksBrokerProxy();
      proxy.setupPortInUse({ port: PORT });

      const result = await smoketestRunTeardownChecksBroker({
        checks: [portCheck],
      });

      expect(result).toStrictEqual({ passed: false, failures: [portCheck] });
    });
  });

  describe('process still alive', () => {
    it('INVALID: {current test-runner pid} => returns failures containing the process check', async () => {
      const proxy = smoketestRunTeardownChecksBrokerProxy();
      proxy.setupProcessAlive({ pid: ALIVE_PID });

      const result = await smoketestRunTeardownChecksBroker({
        checks: [alivePidProcessCheck],
      });

      expect(result).toStrictEqual({ passed: false, failures: [alivePidProcessCheck] });
    });
  });

  describe('mixed pass/fail preserves input order', () => {
    it('INVALID: {port free but current-runner pid alive} => failures contain only the process check in original order', async () => {
      const proxy = smoketestRunTeardownChecksBrokerProxy();
      proxy.setupPortFree({ port: PORT });
      proxy.setupProcessAlive({ pid: ALIVE_PID });

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
