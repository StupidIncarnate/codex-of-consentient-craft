const baseConfig = require('../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // A worker here RETAINS every test file it has already run, and dies of it partway through the
  // suite — `JavaScript heap out of memory`, on a different file each run, which reads as a flake
  // in whichever file drew the short straw. The retention is described in
  // packages/orchestrator/CLAUDE.md under "Importing the barrel in a unit test leaks real timers":
  // this package's adapters reach `@dungeonmaster/orchestrator`, whose barrel starts intervals and
  // fs watchers at MODULE LOAD. Those live in the worker's libuv loop rather than its module
  // registry, so jest's per-file reset never clears them and each one holds its file's whole module
  // graph alive behind it.
  //
  // Recycling the worker between files is what bounds that. It is the SYMPTOM being treated —
  // neutralising the barrel's bootstraps per file, the way that package's own `index.test.ts` does
  // with a module-scope proxy, is what would remove the growth itself.
  workerIdleMemoryLimit: '1GB',
};
