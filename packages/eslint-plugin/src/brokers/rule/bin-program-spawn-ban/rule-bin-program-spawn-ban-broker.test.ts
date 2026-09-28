import { ruleBinProgramSpawnBanBroker } from './rule-bin-program-spawn-ban-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

const ruleTester = ruleTesterHarness();

// Every case passes `scope` explicitly (except the gateway-exempt ones, which return before scope
// is ever read) so this rule's own unit test never falls through to the real filesystem walk.
ruleTester.run('bin-program-spawn-ban', ruleBinProgramSpawnBanBroker(), {
  valid: [
    // --- the gateway's own bin implementation is exempt: it must spawn its own program ---
    {
      code: "import { run } from '@dungeonmaster/node/child_process'; run({ command: 'git', args: ['rev-parse', 'HEAD'], cwd: '/repo' });",
      filename: '/repo/packages/@gateway/bin/src/git/git-run.ts',
    },

    // --- a command built at runtime is not statically resolvable, so it is allowed ---
    {
      code: "import { run } from '@dungeonmaster/node/child_process'; const userConfig = readConfig(); run({ command: userConfig.devCommand, args: [], cwd: '/repo' });",
      filename: '/repo/packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- the Claude CLI's resolved path is a variable, not a literal, so this rule never
    // double-reports it: raw-import-ban is what flags the require.resolve() itself ---
    {
      code: "import { spawn } from 'child_process'; const claudeCliResolvedPath = require.resolve('@anthropic-ai/claude-code'); spawn(claudeCliResolvedPath, []);",
      filename:
        '/repo/packages/orchestrator/src/brokers/agent/spawn-unified/agent-spawn-unified-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- exact-token match only: "gitk" is a different program from "git" ---
    {
      code: "import { spawn } from 'child_process'; spawn('gitk', []);",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- a call to an untracked function is not a spawn at all ---
    {
      code: "import { spawn } from 'child_process'; doSomething('git');",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },

    // --- a program with no home in @dungeonmaster/bin is allowed through the gateway function ---
    {
      code: "import { run } from '@dungeonmaster/node/child_process'; run({ command: 'tsc', args: ['--noEmit'], cwd: '/repo' });",
      filename: '/repo/packages/ward/src/brokers/bundle/build/bundle-build-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
    },
  ],

  invalid: [
    // --- raw spawn() with a literal command ---
    {
      code: "import { spawn } from 'child_process'; spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD']);",
      filename:
        '/repo/packages/orchestrator/src/adapters/git/current-branch/git-current-branch-adapter.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: {
            program: 'git',
            binFunction: 'currentBranch',
            gatewayPath: '#gateway/bin/git',
          },
        },
      ],
    },

    // --- template literal whose static leading segment names the program ---
    {
      code: `import { spawn } from 'child_process'; const subcommand = 'status'; spawn(\`git \${subcommand}\`, []);`,
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: {
            program: 'git',
            binFunction: 'currentBranch',
            gatewayPath: '#gateway/bin/git',
          },
        },
      ],
    },

    // --- sh -c '<script>' as one combined string ---
    {
      code: "import { execSync } from 'child_process'; execSync(\"sh -c 'git status'\");",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: {
            program: 'git',
            binFunction: 'currentBranch',
            gatewayPath: '#gateway/bin/git',
          },
        },
      ],
    },

    // --- a same-module statics object resolves a gateway call's command property ---
    {
      code: "import { run } from '@dungeonmaster/node/child_process'; const lsofStatics = { command: 'lsof' } as const; run({ command: lsofStatics.command, args: ['-ti', ':3737'], cwd: '/repo' });",
      filename: '/repo/packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: {
            program: 'lsof',
            binFunction: 'listeningPids',
            gatewayPath: '#gateway/bin/lsof',
          },
        },
      ],
    },

    // --- the Claude CLI, spawned by a bare literal name instead of a resolved path ---
    {
      code: "import { spawn } from 'child_process'; spawn('claude', ['--print']);",
      filename:
        '/repo/packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: {
            program: 'claude',
            binFunction: 'spawnStreamJson',
            gatewayPath: '#gateway/bin/claude',
          },
        },
      ],
    },

    // --- npm, spawned through the gateway's own run() ---
    {
      code: "import { run } from '@dungeonmaster/node/child_process'; run({ command: 'npm', args: ['install'], cwd: '/repo' });",
      filename: '/repo/packages/siegelense/src/adapters/npm/install/npm-install-adapter.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: { program: 'npm', binFunction: 'install', gatewayPath: '#gateway/bin/npm' },
        },
      ],
    },

    // --- kill, through a raw spawnSync ---
    {
      code: "import { spawnSync } from 'child_process'; spawnSync('kill', ['-9', '1234']);",
      filename:
        '/repo/packages/orchestrator/src/adapters/process/kill-by-port/process-kill-by-port-adapter.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: { program: 'kill', binFunction: 'killPid', gatewayPath: '#gateway/bin/kill' },
        },
      ],
    },

    // --- cp, through a raw execFile ---
    {
      code: "import { execFile } from 'child_process'; execFile('cp', ['-a', '/from', '/to']);",
      filename:
        '/repo/packages/orchestrator/src/brokers/worktree/seed-dist/worktree-seed-dist-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: {
            program: 'cp',
            binFunction: 'copyRecursive',
            gatewayPath: '#gateway/bin/cp',
          },
        },
      ],
    },

    // --- a namespace import reaching a raw function through member access ---
    {
      code: "import * as childProcess from 'child_process'; childProcess.spawn('git', ['status']);",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: {
            program: 'git',
            binFunction: 'currentBranch',
            gatewayPath: '#gateway/bin/git',
          },
        },
      ],
    },

    // --- the node: prefixed raw import is caught the same as the bare specifier ---
    {
      code: "import { spawn } from 'node:child_process'; spawn('git', ['status']);",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@dungeonmaster' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: {
            program: 'git',
            binFunction: 'currentBranch',
            gatewayPath: '#gateway/bin/git',
          },
        },
      ],
    },

    // --- consumer scope only gates which raw imports are workspace imports; the suggested
    // gatewayPath is always the '#gateway/...' alias text, identical in every consumer repo ---
    {
      code: "import { spawn } from 'child_process'; spawn('git', ['status']);",
      filename: '/repo/packages/hooks/src/brokers/x/x-broker.ts',
      options: [{ scope: '@acme' }],
      errors: [
        {
          messageId: 'binProgramSpawn',
          data: { program: 'git', binFunction: 'currentBranch', gatewayPath: '#gateway/bin/git' },
        },
      ],
    },
  ],
});
