/**
 * PURPOSE: Test proxy for InstallConfigCreateResponder, staging the gateway's `.mcp.json`
 * read/write and the still-adapter-based settings/agents brokers this responder also calls.
 *
 * USAGE:
 * const proxy = InstallConfigCreateResponderProxy();
 * proxy.setupFileRead({ targetProjectRoot, content: '{"mcpServers":{}}' });
 * const result = await proxy.callResponder({ context });
 */

import { join } from 'path';
import { readJsonFileIfExistsProxy, writeFileProxy } from '#gateway/node/_test_/fs__promises';
import { settingsPermissionsAddBrokerProxy } from '../../../brokers/settings/permissions-add/settings-permissions-add-broker.proxy';
import { agentsPluginCreateBrokerProxy } from '../../../brokers/agents/plugin-create/agents-plugin-create-broker.proxy';
import { PathSegmentStub, pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { FilePathStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { InstallConfigCreateResponder } from './install-config-create-responder';

type FilePath = ReturnType<typeof FilePathStub>;
type PathSegment = ReturnType<typeof PathSegmentStub>;

export const InstallConfigCreateResponderProxy = (): {
  callResponder: typeof InstallConfigCreateResponder;
  setupFileRead: ({
    targetProjectRoot,
    content,
  }: {
    targetProjectRoot: FilePath;
    content: string;
  }) => void;
  setupFileMissing: ({ targetProjectRoot }: { targetProjectRoot: FilePath }) => void;
  setupCorruptFile: ({
    targetProjectRoot,
    rawContents,
  }: {
    targetProjectRoot: FilePath;
    rawContents: string;
  }) => void;
  setupFileReadError: ({
    targetProjectRoot,
    error,
  }: {
    targetProjectRoot: FilePath;
    error: unknown;
  }) => void;
  getWrittenConfig: ({ targetProjectRoot }: { targetProjectRoot: FilePath }) => unknown;
} => {
  const readProxy = readJsonFileIfExistsProxy();
  const writeProxy = writeFileProxy();
  const settingsProxy = settingsPermissionsAddBrokerProxy();
  const agentsProxy = agentsPluginCreateBrokerProxy();

  // Mirrors the responder's own configPath computation so the read/write addresses below match
  // what it really calls join with.
  const configPathFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): PathSegment =>
    PathSegmentStub({ value: join(targetProjectRoot, locationsStatics.repoRoot.mcpJson) });
  const claudeSettingsPathFor = ({
    targetProjectRoot,
  }: {
    targetProjectRoot: FilePath;
  }): PathSegment =>
    PathSegmentStub({
      value: join(
        targetProjectRoot,
        locationsStatics.repoRoot.claude.dir,
        locationsStatics.repoRoot.claude.settings,
      ),
    });

  return {
    callResponder: InstallConfigCreateResponder,

    setupFileRead: ({
      targetProjectRoot,
      content,
    }: {
      targetProjectRoot: FilePath;
      content: string;
    }): void => {
      readProxy.returnsRaw({ path: configPathFor({ targetProjectRoot }), rawContents: content });
      writeProxy.succeeds({ path: configPathFor({ targetProjectRoot }) });
      settingsProxy.setupNoExistingSettings({
        targetProjectRoot: pathSegmentContract.parse(targetProjectRoot),
        settingsPath: claudeSettingsPathFor({ targetProjectRoot }),
      });
      agentsProxy.setupSuccess({
        targetProjectRoot: pathSegmentContract.parse(targetProjectRoot),
      });
    },

    setupFileMissing: ({ targetProjectRoot }: { targetProjectRoot: FilePath }): void => {
      readProxy.missing({ path: configPathFor({ targetProjectRoot }) });
      writeProxy.succeeds({ path: configPathFor({ targetProjectRoot }) });
      settingsProxy.setupNoExistingSettings({
        targetProjectRoot: pathSegmentContract.parse(targetProjectRoot),
        settingsPath: claudeSettingsPathFor({ targetProjectRoot }),
      });
      agentsProxy.setupSuccess({
        targetProjectRoot: pathSegmentContract.parse(targetProjectRoot),
      });
    },

    // No write/settings/agents setup here: real JSON.parse throws on this content before the
    // responder reaches any of them, so staging those proxies would hide a regression that made
    // the responder reach past the corrupt read.
    setupCorruptFile: ({
      targetProjectRoot,
      rawContents,
    }: {
      targetProjectRoot: FilePath;
      rawContents: string;
    }): void => {
      readProxy.returnsRaw({ path: configPathFor({ targetProjectRoot }), rawContents });
    },

    // No write/settings/agents setup here: the read rejects before the responder ever calls them,
    // so staging those proxies would hide a regression that made the responder call them anyway.
    setupFileReadError: ({
      targetProjectRoot,
      error,
    }: {
      targetProjectRoot: FilePath;
      error: unknown;
    }): void => {
      readProxy.rejects({ path: configPathFor({ targetProjectRoot }), error });
    },

    getWrittenConfig: ({ targetProjectRoot }: { targetProjectRoot: FilePath }): unknown =>
      writeProxy.writtenContentsFor({ path: configPathFor({ targetProjectRoot }) }),
  };
};
