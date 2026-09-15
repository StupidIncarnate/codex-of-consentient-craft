/**
 * PURPOSE: Public entry point for this package's test proxies — every downstream import
 * of '@dungeonmaster/siegelense/testing' resolves through this file.
 *
 * USAGE:
 * import { instanceStartBrokerProxy } from '@dungeonmaster/siegelense/testing';
 */

export * from './src/brokers/registry/read/registry-read-broker.proxy';
export * from './src/brokers/instance/start/instance-start-broker.proxy';
export * from './src/brokers/instance/run/instance-run-broker.proxy';
export * from './src/brokers/instance/kill/instance-kill-broker.proxy';
