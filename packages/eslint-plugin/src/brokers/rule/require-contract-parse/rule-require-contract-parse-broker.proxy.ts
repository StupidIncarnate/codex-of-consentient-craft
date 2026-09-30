import { contractIndexBuildBrokerProxy } from '@dungeonmaster/shared/brokers/contract-index/build/contract-index-build-broker.proxy';

export const ruleRequireContractParseBrokerProxy = (): {
  setupProject: ({
    parsedContractText,
    lonelyContractText,
    parsingBrokerText,
    functionTypesContractText,
    dataTypeContractText,
    driftedTypeContractText,
  }: {
    parsedContractText: string;
    lonelyContractText: string;
    parsingBrokerText: string;
    functionTypesContractText: string;
    dataTypeContractText: string;
    driftedTypeContractText: string;
  }) => void;
} => {
  const buildProxy = contractIndexBuildBrokerProxy();
  const packageDir = '/project/packages/alpha';
  const srcDir = '/project/packages/alpha/src';
  const contractsDir = '/project/packages/alpha/src/contracts';
  const brokersDir = '/project/packages/alpha/src/brokers';

  return {
    setupProject: ({
      parsedContractText,
      lonelyContractText,
      parsingBrokerText,
      functionTypesContractText,
      dataTypeContractText,
      driftedTypeContractText,
    }: {
      parsedContractText: string;
      lonelyContractText: string;
      parsingBrokerText: string;
      functionTypesContractText: string;
      dataTypeContractText: string;
      driftedTypeContractText: string;
    }): void => {
      buildProxy.setupSubfolders({
        dirPath: '/project/packages',
        folders: ['alpha'],
      });
      buildProxy.setupPackageJson({ packageDir, json: '{"name":"@project/alpha"}' });
      buildProxy.setupWalkedFolder({ dirPath: packageDir, folders: ['src'], files: [] });
      buildProxy.setupWalkedFolder({
        dirPath: srcDir,
        folders: ['contracts', 'brokers'],
        files: [],
      });
      buildProxy.setupWalkedFolder({
        dirPath: contractsDir,
        folders: ['thing', 'lonely', 'handler', 'plain', 'drifted'],
        files: [],
      });
      buildProxy.setupWalkedFolder({
        dirPath: `${contractsDir}/thing`,
        folders: [],
        files: ['thing-contract.ts'],
      });
      buildProxy.setupWalkedFolder({
        dirPath: `${contractsDir}/lonely`,
        folders: [],
        files: ['lonely-contract.ts'],
      });
      buildProxy.setupWalkedFolder({
        dirPath: `${contractsDir}/handler`,
        folders: [],
        files: ['handler-contract.ts'],
      });
      buildProxy.setupWalkedFolder({
        dirPath: `${contractsDir}/plain`,
        folders: [],
        files: ['plain-contract.ts'],
      });
      buildProxy.setupWalkedFolder({
        dirPath: `${contractsDir}/drifted`,
        folders: [],
        files: ['drifted-contract.ts'],
      });
      buildProxy.setupWalkedFolder({ dirPath: brokersDir, folders: ['use'], files: [] });
      buildProxy.setupWalkedFolder({
        dirPath: `${brokersDir}/use`,
        folders: [],
        files: ['use-broker.ts'],
      });
      buildProxy.setupSourceText({
        filePath: `${contractsDir}/thing/thing-contract.ts`,
        text: parsedContractText,
      });
      buildProxy.setupSourceText({
        filePath: `${contractsDir}/lonely/lonely-contract.ts`,
        text: lonelyContractText,
      });
      buildProxy.setupSourceText({
        filePath: `${contractsDir}/handler/handler-contract.ts`,
        text: functionTypesContractText,
      });
      buildProxy.setupSourceText({
        filePath: `${contractsDir}/plain/plain-contract.ts`,
        text: dataTypeContractText,
      });
      buildProxy.setupSourceText({
        filePath: `${contractsDir}/drifted/drifted-contract.ts`,
        text: driftedTypeContractText,
      });
      buildProxy.setupSourceText({
        filePath: `${brokersDir}/use/use-broker.ts`,
        text: parsingBrokerText,
      });
    },
  };
};
