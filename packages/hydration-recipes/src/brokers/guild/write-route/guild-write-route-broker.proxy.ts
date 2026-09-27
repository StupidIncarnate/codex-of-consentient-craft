import { guildAddBroker } from '@dungeonmaster/orchestrator/brokers';
import { guildAddBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { resolve } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';

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
  pathsTouched: () => readonly unknown[];
  registrationsMade: () => readonly unknown[];
} => {
  const ensureDirHandle = ensureDirProxy();
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
      const targetRoot = resolve(home);
      const guildDir = resolve(path);
      if (guildDir === targetRoot || guildDir.startsWith(`${targetRoot}/`)) {
        ensureDirHandle.succeeds({ path: guildDir });
      }
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
      const targetRoot = resolve(home);
      const guildDir = resolve(path);
      if (guildDir === targetRoot || guildDir.startsWith(`${targetRoot}/`)) {
        ensureDirHandle.succeeds({ path: guildDir });
      }
      addGuildHandle.calledWith([{ name, path, home, id }]).resolves(guild);
    },
    setupDirectoryCreation: ({ path }: { path: string }): void => {
      ensureDirHandle.succeeds({ path });
    },
    // Every filesystem path the route reached — the one directory it makes, and nothing else, since
    // `guildAddBroker` is mocked at the broker boundary and its own mkdir never runs. Assert
    // containment against this, never against a staged address.
    pathsTouched: (): readonly unknown[] =>
      ensureDirHandle.getCallsFor({ path: () => true }).map((call) => call[0]),
    // The whole argument object of every `guildAddBroker` call, so a test reads back the home the
    // route really handed down rather than inferring it from a mock address that happened to match.
    registrationsMade: (): readonly unknown[] =>
      addGuildHandle.callsMatching([]).map((call) => call[0]),
  };
};
