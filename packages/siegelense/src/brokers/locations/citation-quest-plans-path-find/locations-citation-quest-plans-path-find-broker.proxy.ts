import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

// worktreePath arrives fully resolved as a parameter and the single join runs through
// pathJoinAdapter's real, deterministic implementation — there is nothing to stage beyond
// instantiating its proxy, which enforce-proxy-child-creation requires.
export const locationsCitationQuestPlansPathFindBrokerProxy = (): Record<PropertyKey, never> => {
  pathJoinAdapterProxy();

  return {};
};
