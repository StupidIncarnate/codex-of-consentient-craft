import { guildAddBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { guildNameContract, guildPathContract } from '@dungeonmaster/shared/contracts';

import { guildDirectoryEnsureBrokerProxy } from '../directory-ensure/guild-directory-ensure-broker.proxy';
import { guildUniquePathResolveBrokerProxy } from '../unique-path-resolve/guild-unique-path-resolve-broker.proxy';
import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';

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
  // guildAddBrokerProxy answers one exact input with a caller-chosen guild — its real run mints a
  // fixed id and createdAt, which the route's tests do not want.
  const addGuildProxy = guildAddBrokerProxy();

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
      addGuildProxy.setupResolves({
        input: { name: guildNameContract.parse(name), path: guildPathContract.parse(path), home },
        guild,
      });
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
      addGuildProxy.setupResolves({
        input: {
          name: guildNameContract.parse(name),
          path: guildPathContract.parse(path),
          home,
          id,
        },
        guild,
      });
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
    registrationsMade: (): readonly unknown[] => addGuildProxy.getCallInputs(),
  };
};
