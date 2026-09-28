import { guildAddBroker } from '@dungeonmaster/orchestrator/brokers';
import { guildAddBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { guildDirectoryEnsureBrokerProxy } from '../directory-ensure/guild-directory-ensure-broker.proxy';
import { guildUniquePathResolveBrokerProxy } from '../unique-path-resolve/guild-unique-path-resolve-broker.proxy';
import type { GuildStub } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;

export const guildWriteRouteBrokerProxy = (): {
  succeeds: ({
    name,
    path,
    home,
    guild,
  }: {
    name: string;
    path: string;
    home: string;
    guild: Guild;
  }) => void;
  succeedsWithId: ({
    name,
    path,
    home,
    id,
    guild,
  }: {
    name: string;
    path: string;
    home: string;
    id: string;
    guild: Guild;
  }) => void;
  setupDirectoryCreation: ({ path }: { path: string }) => void;
  setupPathFree: ({ path }: { path: string }) => void;
  pathsTouched: () => readonly unknown[];
  registrationsMade: () => readonly unknown[];
} => {
  // guildDirectoryEnsureBrokerProxy composes the fsMkdir/pathResolve mocking this route's own
  // fencing needs — shared with the api route's proxy so both stay in sync. It also covers the
  // invalid-id scenario, where the directory ensure runs before the id validation throws.
  const directoryProxy = guildDirectoryEnsureBrokerProxy();
  const uniquePathProxy = guildUniquePathResolveBrokerProxy();
  // guildAddBrokerProxy's own setup mints a FIXED id/createdAt via crypto.randomUUID, which does
  // not let a test stage an arbitrary `guild` fixture — created here only to satisfy
  // `enforce-proxy-child-creation`; this route's own registerMock below stages the real answer.
  guildAddBrokerProxy();
  const addGuildHandle = registerMock({ fn: guildAddBroker });

  return {
    // `home` is part of the ADDRESS, not a convenience: a route that stopped handing
    // `target.home` down would call `guildAddBroker` with a shape this staging does not describe,
    // and the unmatched call throws rather than quietly registering into the process-wide home.
    succeeds: ({
      name,
      path,
      home,
      guild,
    }: {
      name: string;
      path: string;
      home: string;
      guild: Guild;
    }): void => {
      directoryProxy.setupDirectoryCreation({ path });
      uniquePathProxy.setupFree({ absolutePaths: [path] });
      addGuildHandle.calledWith([{ name, path, home }]).resolves(guild);
    },
    // A more specific address than `succeeds` above (it names `id` too) — for a call this route
    // makes WITH an id, so the two scenarios never collide under "most specific wins".
    succeedsWithId: ({
      name,
      path,
      home,
      id,
      guild,
    }: {
      name: string;
      path: string;
      home: string;
      id: string;
      guild: Guild;
    }): void => {
      directoryProxy.setupDirectoryCreation({ path });
      uniquePathProxy.setupFree({ absolutePaths: [path] });
      addGuildHandle.calledWith([{ name, path, home, id }]).resolves(guild);
    },
    setupDirectoryCreation: ({ path }: { path: string }): void => {
      directoryProxy.setupDirectoryCreation({ path });
      uniquePathProxy.setupFree({ absolutePaths: [path] });
    },
    setupPathFree: ({ path }: { path: string }): void => {
      uniquePathProxy.setupFree({ absolutePaths: [path] });
    },
    // Every filesystem path the route reached — the one directory it makes, and nothing else, since
    // `guildAddBroker` is mocked at the broker boundary and its own mkdir never runs. Assert
    // containment against this, never against a staged address.
    pathsTouched: (): readonly unknown[] => directoryProxy.pathsTouched(),
    // The whole argument object of every `guildAddBroker` call, so a test reads back the home the
    // route really handed down rather than inferring it from a mock address that happened to match.
    registrationsMade: (): readonly unknown[] =>
      addGuildHandle.callsMatching([]).map((call) => call[0]),
  };
};
