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

import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { ContentText, FilePath } from '@dungeonmaster/shared/contracts';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { heartbeatWriteBrokerProxy } from '../../heartbeat/write/heartbeat-write-broker.proxy';
import { profileSampleRecordBroker } from '../../profile/sample-record/profile-sample-record-broker';
import { profileSampleRecordBrokerProxy } from '../../profile/sample-record/profile-sample-record-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });

export const driverHeartbeatTickBrokerProxy = (): {
  stageBeatSucceeds: (params: {
    evidencePath: FilePath;
    registryJson: string;
    nowMs: number;
  }) => void;
  stageBeatSucceedsWithMeasuredRss: (params: {
    evidencePath: FilePath;
    registryJson: string;
    nowMs: number;
    pid: string;
    pgrp: number;
    residentPages: number;
  }) => void;
  stageSampleRecordFails: (params: { error: Error }) => void;
  getWrittenHeartbeatContent: (params: { evidencePath: FilePath }) => unknown;
  getSampleRecordCalls: () => readonly unknown[];
  getStderrMessages: () => readonly ContentText[];
} => {
  const heartbeatProxy = heartbeatWriteBrokerProxy();
  // Constructed for enforce-proxy-child-creation only — the sampler itself is mocked below.
  profileSampleRecordBrokerProxy();

  const sampleHandle = registerMock({ fn: profileSampleRecordBroker });
  // The sampler's own return value is nothing this broker reads; every test that cares asserts the
  // ARGUMENTS it was handed, through getSampleRecordCalls.
  sampleHandle.calledWith([]).resolves(null);

  const stderrHandle = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrHandle.calledWith([]).returns(true);

  return {
    stageBeatSucceeds: ({
      evidencePath,
      registryJson,
      nowMs,
    }: {
      evidencePath: FilePath;
      registryJson: string;
      nowMs: number;
    }): void => {
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
      evidencePath,
      registryJson,
      nowMs,
      pid,
      pgrp,
      residentPages,
    }: {
      evidencePath: FilePath;
      registryJson: string;
      nowMs: number;
      pid: string;
      pgrp: number;
      residentPages: number;
    }): void => {
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

    stageSampleRecordFails: ({ error }: { error: Error }): void => {
      sampleHandle.calledWith([]).rejects(error);
    },

    getWrittenHeartbeatContent: ({ evidencePath }: { evidencePath: FilePath }): unknown =>
      heartbeatProxy.getWrittenHeartbeatContent({ evidencePath }),

    getSampleRecordCalls: (): readonly unknown[] =>
      sampleHandle.callsMatching([]).map((call) => call[0]),

    getStderrMessages: (): readonly ContentText[] =>
      stderrHandle.callsMatching([]).map((call) => ContentTextStub({ value: String(call[0]) })),
  };
};
