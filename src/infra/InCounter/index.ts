import * as azure from "@pulumi/azure";

import Options from "./../options";

// todo: Make this
export default (options: Options) => {
  const containerEventHubsCapture = new azure.storage.Container(`${options.prefix}-count-ehc`, {
    ...options.defaultArgs,
    storageAccountName: options.storageAccountEventHubsCapture.name,
  }, {
    parent: options.storageAccountEventHubsCapture
  });

  const eventHubMain = new azure.eventhub.EventHub(`${options.prefix}-count-eh`, {
    ...options.defaultArgs,
    namespaceName: options.eventHubsNamespace.name,
    messageRetention: 1,
    partitionCount: 1,
    captureDescription: {
      enabled: true,
      intervalInSeconds: 60,
      encoding: "AvroDeflate",
      destination: {
        name: "EventHubArchive.AzureBlockBlob",
        blobContainerName: containerEventHubsCapture.name,
        storageAccountId: options.storageAccountEventHubsCapture.id,
        archiveNameFormat: "{Namespace}/{EventHub}/{PartitionId}/{Year}/{Month}/{Day}/{Hour}/{Minute}/{Second}",
      },
    },
  }, {
    parent: options.eventHubsNamespace,
  });
};
