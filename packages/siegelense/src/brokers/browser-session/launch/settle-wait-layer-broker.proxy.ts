// PURPOSE: Delegates every fake-page scenario to settlePollLayerBrokerProxy, which owns the
// virtual clock, so a test of the detector drives the REAL poll layer against faked `evaluate` and
// `pause` closures rather than a second fake of its own.
// USAGE: const proxy = settleWaitLayerBrokerProxy(); const fake = proxy.pageQuiet();
//        settleWaitLayerBroker({ evaluate: fake.evaluate, pause: fake.pause });

import { settlePollLayerBrokerProxy } from './settle-poll-layer-broker.proxy';

type FakeSettlePage = ReturnType<ReturnType<typeof settlePollLayerBrokerProxy>['pageQuiet']>;

export const settleWaitLayerBrokerProxy = (): {
  pageQuiet: () => FakeSettlePage;
  pageMutatingFor: (params: { mutatingForMs: number }) => FakeSettlePage;
  pageAnimatingForever: () => FakeSettlePage;
} => {
  const pollProxy = settlePollLayerBrokerProxy();

  return {
    pageQuiet: (): FakeSettlePage => pollProxy.pageQuiet(),
    pageMutatingFor: ({ mutatingForMs }: { mutatingForMs: number }): FakeSettlePage =>
      pollProxy.pageMutatingFor({ mutatingForMs }),
    pageAnimatingForever: (): FakeSettlePage => pollProxy.pageAnimatingForever(),
  };
};
