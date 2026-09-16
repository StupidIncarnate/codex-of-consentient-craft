/**
 * PURPOSE: Proxy for siegelense-read-layer-responder. Mocks the four siegelense package functions
 * this responder calls directly — `resultsReadBroker`, `statusReadBroker`, `compareReadBroker` and
 * `cleanupRunBroker` — at the same reference the responder imports, mirroring
 * `siegelense-handle-responder.proxy`'s own boundary for `siegelense-start`/`run`/`kill`.
 *
 * USAGE:
 * const proxy = SiegelenseReadLayerResponderProxy();
 * proxy.setupResultsReturns({ query: ResultsQueryStub(), answer: ResultsAnswerStub() });
 */

import {
  cleanupRunBroker,
  compareReadBroker,
  resultsReadBroker,
  statusReadBroker,
} from '@dungeonmaster/siegelense/brokers';
import {
  cleanupRunBrokerProxy,
  compareReadBrokerProxy,
  resultsReadBrokerProxy,
  statusReadBrokerProxy,
} from '@dungeonmaster/siegelense/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type ResultsQuery = Parameters<typeof resultsReadBroker>[0]['query'];
type ResultsAnswer = Awaited<ReturnType<typeof resultsReadBroker>>;
type InstanceId = Parameters<typeof statusReadBroker>[0]['instanceId'];
type StatusAnswer = Awaited<ReturnType<typeof statusReadBroker>>;
type CompareQuery = Parameters<typeof compareReadBroker>[0]['query'];
type CompareAnswer = Awaited<ReturnType<typeof compareReadBroker>>;
type CleanupAnswer = Awaited<ReturnType<typeof cleanupRunBroker>>;

export const SiegelenseReadLayerResponderProxy = (): {
  setupResultsReturns: (params: { query: ResultsQuery; answer: ResultsAnswer }) => void;
  setupResultsThrows: (params: { query: ResultsQuery; error: Error }) => void;
  setupStatusReturns: (params: { instanceId: InstanceId; answer: StatusAnswer }) => void;
  setupStatusThrows: (params: { instanceId: InstanceId; error: Error }) => void;
  setupCompareReturns: (params: { query: CompareQuery; answer: CompareAnswer }) => void;
  setupCompareThrows: (params: { query: CompareQuery; error: Error }) => void;
  setupCleanupReturns: (params: { answer: CleanupAnswer }) => void;
  setupCleanupThrows: (params: { error: Error }) => void;
} => {
  // Composed to satisfy enforce-proxy-child-creation. This responder calls the four siegelense
  // broker functions directly (no adapter in between), so the mock boundary this proxy actually
  // stages is those broker functions themselves, below — the registerMock calls intercept the call
  // before any of that real broker body ever runs, the same "created but never driven" shape
  // siegelense-handle-responder.proxy uses for start/run/kill.
  resultsReadBrokerProxy();
  statusReadBrokerProxy();
  compareReadBrokerProxy();
  cleanupRunBrokerProxy();

  const resultsHandle = registerMock({ fn: resultsReadBroker });
  const statusHandle = registerMock({ fn: statusReadBroker });
  const compareHandle = registerMock({ fn: compareReadBroker });
  const cleanupHandle = registerMock({ fn: cleanupRunBroker });

  return {
    setupResultsReturns: ({
      query,
      answer,
    }: {
      query: ResultsQuery;
      answer: ResultsAnswer;
    }): void => {
      resultsHandle.calledWith([{ query }]).resolves(answer);
    },
    setupResultsThrows: ({ query, error }: { query: ResultsQuery; error: Error }): void => {
      resultsHandle.calledWith([{ query }]).rejects(error);
    },
    setupStatusReturns: ({
      instanceId,
      answer,
    }: {
      instanceId: InstanceId;
      answer: StatusAnswer;
    }): void => {
      statusHandle.calledWith([{ instanceId }]).resolves(answer);
    },
    setupStatusThrows: ({ instanceId, error }: { instanceId: InstanceId; error: Error }): void => {
      statusHandle.calledWith([{ instanceId }]).rejects(error);
    },
    setupCompareReturns: ({
      query,
      answer,
    }: {
      query: CompareQuery;
      answer: CompareAnswer;
    }): void => {
      compareHandle.calledWith([{ query }]).resolves(answer);
    },
    setupCompareThrows: ({ query, error }: { query: CompareQuery; error: Error }): void => {
      compareHandle.calledWith([{ query }]).rejects(error);
    },
    setupCleanupReturns: ({ answer }: { answer: CleanupAnswer }): void => {
      cleanupHandle.calledWith([]).resolves(answer);
    },
    setupCleanupThrows: ({ error }: { error: Error }): void => {
      cleanupHandle.calledWith([]).rejects(error);
    },
  };
};
