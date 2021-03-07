import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

import { DefaultArgs } from "./options";
import Options from "./options";

import infraInCounter from "./InCounter";

const prefix = `eha-${pulumi.getStack()}`.toLowerCase();

const defaultTags = {
  tags: {
    project: pulumi.getProject(),
    environment: pulumi.getStack(),
  },
};

const resourceGroup = new azure.core.ResourceGroup(`${prefix}-rg`, defaultTags);

// There is a bug in pulumi/azure such that the properties are not cast correct
const defaultArgs: DefaultArgs = {
  resourceGroupName: resourceGroup.name as unknown as string,
  location: resourceGroup.location as unknown as string,
  ...defaultTags,
};

const eventHubsNamespace = new azure.eventhub.EventHubNamespace(`${prefix}-ehns`, {
  ...defaultArgs,
  sku: "Standard",
  autoInflateEnabled: true,
  maximumThroughputUnits: 2,
  capacity: 1,
}, {
  parent: resourceGroup,
});

// For some reason, Accounts cannot have - in their name
const storageAccountEventHubsCapture = new azure.storage.Account(`${prefix.replace('-', '')}ehst`, {
  ...defaultArgs,
  accountKind: "StorageV2",
  accountTier: "Standard",
  accountReplicationType: "LRS",
}, {
  parent: resourceGroup
});

const options: Options = {
  prefix,
  defaultArgs,
  resourceGroup,
  eventHubsNamespace,
  storageAccountEventHubsCapture,
};

infraInCounter(options);
