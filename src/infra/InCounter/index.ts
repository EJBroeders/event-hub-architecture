import * as pulumi from "@pulumi/pulumi";

import * as eventhub from "@pulumi/azure-native/eventhub";
import * as storage from "@pulumi/azure-native/storage";

import Options from "./../options";

import { getConnectionEventHubString } from "./../helpers";

export default (options: Options): pulumi.Output<string> => {
  const containerEventHubsCapture = new storage.BlobContainer(`${options.prefix}-count-ehc`, {
    ...options.defaultArgs,
    accountName: options.storageAccountEventHubsCapture.name,
  }, {
    parent: options.storageAccountEventHubsCapture
  });

  const eventHubCounter = new eventhub.EventHub(`${options.prefix}-count-eh`, {
    ...options.defaultArgs,
    eventHubName: "counter",
    namespaceName: options.eventHubsNamespace.name,
    messageRetentionInDays: 1,
    partitionCount: 1,
    captureDescription: {
      enabled: true,
      intervalInSeconds: 60,
      encoding: "AvroDeflate",
      destination: {
        name: "EventHubArchive.AzureBlockBlob",
        blobContainer: containerEventHubsCapture.name,
        storageAccountResourceId: options.storageAccountEventHubsCapture.id,
        archiveNameFormat: "{Namespace}/{EventHub}/{PartitionId}/{Year}/{Month}/{Day}/{Hour}/{Minute}/{Second}",
      },
    },
  }, {
    parent: options.eventHubsNamespace,
  });

  const eventHubFunctionAppAuthorizationRule = new eventhub.EventHubAuthorizationRule(`${options.prefix}-count-ehar`, {
    ...options.defaultArgs,
    namespaceName: options.eventHubsNamespace.name,
    eventHubName: eventHubCounter.name,
    rights: ["Listen", "Send"],
  }, {
    parent: eventHubCounter
  });

  return getConnectionEventHubString(eventHubFunctionAppAuthorizationRule.name, eventHubCounter.name, options.eventHubsNamespace.name, options.resourceGroup.name);
};
