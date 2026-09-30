/**
 * PURPOSE: Composes heartbeatWriteBrokerProxy behind semantic setup methods, fixing the home/root
 * path triple every heartbeat write in this package resolves through so a test only ever names its
 * own instance-specific evidence path. `profileSampleRecordBroker` is mocked DIRECTLY rather than
 * staged through its own child proxies: this broker's contract with the sampler is the payload it
 * hands over and the fact that a sampler failure never voids the beat, and both are readable off the
 * recorded calls. `profileSampleRecordBrokerProxy` is still constructed, never addressed, to satisfy
 * `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = driverHeartbeatTickBrokerProxy();
 * proxy.stageBeatSucceeds({ evidencePath, registryJson, nowMs });
 * proxy.getSampleRecordCalls();
 */

import { pidProxy } from '#gateway/node/process/pid/pid.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import type { ContentText, FilePath, SiegeInstance } from '@dungeonmaster/shared/contracts';
import { ContentTextStub } from '@dungeonmaster/shared/contracts/content-text/content-text.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { heartbeatWriteBrokerProxy } from '../../heartbeat/write/heartbeat-write-broker.proxy';
import { profileSampleRecordBroker } from '../../profile/sample-record/profile-sample-record-broker';
import { profileSampleRecordBrokerProxy } from '../../profile/sample-record/profile-sample-record-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });

export const driverHeartbeatTickBrokerProxy = (): {
  stageBeatSucceeds: (params: {
    instanceId: SiegeInstance['id'];
    evidencePath: FilePath;
    registryJson: string;
    nowMs: number;
  }) => void;
  stageBeatSucceedsWithMeasuredRss: (params: {
    instanceId: SiegeInstance['id'];
    evidencePath: FilePath;
    registryJson: string;
    nowMs: number;
    pid: string;
    pgrp: number;
    residentPages: number;
  }) => void;
  stageSampleRecordFails: (params: { error: Error; instanceId: SiegeInstance['id'] }) => void;
  getWrittenHeartbeatContent: (params: { evidencePath: FilePath }) => unknown;
  getSampleRecordCalls: () => readonly unknown[];
  getStderrMessages: () => readonly ContentText[];
} => {
  const heartbeatProxy = heartbeatWriteBrokerProxy();
  // Constructed for enforce-proxy-child-creation only — the sampler itself is mocked below.
  profileSampleRecordBrokerProxy();

  const sampleHandle = registerMock({ fn: profileSampleRecordBroker });
  pidProxy();
  const stderrRecorder = stderrProxy();

  return {
    stageBeatSucceeds: ({
      instanceId,
      evidencePath,
      registryJson,
      nowMs,
    }: {
      instanceId: SiegeInstance['id'];
      evidencePath: FilePath;
      registryJson: string;
      nowMs: number;
    }): void => {
      // The sampler's own return value is nothing this broker reads; every test that cares asserts
      // the ARGUMENTS it was handed, through getSampleRecordCalls.
      sampleHandle.calledWith([{ instanceId }]).resolves(null);
      heartbeatProxy.setupHeartbeatWrite({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        registryJson,
        nowMs,
      });
    },

    stageBeatSucceedsWithMeasuredRss: ({
      instanceId,
      evidencePath,
      registryJson,
      nowMs,
      pid,
      pgrp,
      residentPages,
    }: {
      instanceId: SiegeInstance['id'];
      evidencePath: FilePath;
      registryJson: string;
      nowMs: number;
      pid: string;
      pgrp: number;
      residentPages: number;
    }): void => {
      sampleHandle.calledWith([{ instanceId }]).resolves(null);
      heartbeatProxy.setupHeartbeatWriteWithMeasuredRss({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        registryJson,
        nowMs,
        pid,
        pgrp,
        residentPages,
      });
    },

    stageSampleRecordFails: ({
      error,
      instanceId,
    }: {
      error: Error;
      instanceId: SiegeInstance['id'];
    }): void => {
      sampleHandle.calledWith([{ instanceId }]).rejects(error);
    },

    getWrittenHeartbeatContent: ({ evidencePath }: { evidencePath: FilePath }): unknown =>
      heartbeatProxy.getWrittenHeartbeatContent({ evidencePath }),

    getSampleRecordCalls: (): readonly unknown[] =>
      sampleHandle.callsMatching([]).map((call) => call[0]),

    getStderrMessages: (): readonly ContentText[] =>
      stderrRecorder.getWrites().map((chunk) => ContentTextStub({ value: String(chunk) })),
  };
};
