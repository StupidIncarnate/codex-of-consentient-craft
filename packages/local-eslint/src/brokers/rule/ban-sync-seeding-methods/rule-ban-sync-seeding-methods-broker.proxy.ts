import { ruleBanSyncSeedingMethodsBroker } from './rule-ban-sync-seeding-methods-broker';

export const ruleBanSyncSeedingMethodsBrokerProxy = (): {
  callBroker: typeof ruleBanSyncSeedingMethodsBroker;
} => ({
  callBroker: ruleBanSyncSeedingMethodsBroker,
});
