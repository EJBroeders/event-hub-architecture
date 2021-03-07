import * as pulumi from "@pulumi/pulumi";

import * as eventhub from "@pulumi/azure-native/eventhub";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import * as web from "@pulumi/azure-native/web";

import { DefaultArgs } from "./options";
import Options from "./options";

import { getConnectionString, signedBlobReadUrl } from "./helpers";

import infraInCounter from "./InCounter";

const prefix = `eha-${pulumi.getStack()}`.toLowerCase();

const defaultTags = {
  tags: {
    project: pulumi.getProject(),
    environment: pulumi.getStack(),
  },
};

const resourceGroup = new resources.ResourceGroup(`${prefix}-rg`, defaultTags);

// There is a bug in pulumi/azure such that the properties are not cast correct
const defaultArgs: DefaultArgs = {
  resourceGroupName: resourceGroup.name as unknown as string,
  location: resourceGroup.location as unknown as string,
  sku: {
    name: "Standard",
    tier: "Standard",
  },
  ...defaultTags,
};

const eventHubsNamespace = new eventhub.Namespace(`${prefix}-ehns`, {
  ...defaultArgs,
  isAutoInflateEnabled: true,
  maximumThroughputUnits: 2,
}, {
  parent: resourceGroup,
});

// For some reason, Accounts cannot have - in their name
const storageAccountEventHubsCapture = new storage.StorageAccount(`${prefix.replace('-', '')}ehst`, {
  ...defaultArgs,
  kind: storage.Kind.StorageV2,
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

const counterConnectionString = infraInCounter(options);

// For some reason, Accounts cannot have - in their name
const storageAccountFunc = new storage.StorageAccount(`${prefix.replace('-', '')}func`, {
  ...defaultArgs,
  kind: storage.Kind.StorageV2,
}, {
  parent: resourceGroup
});

const codeContainer = new storage.BlobContainer(`${options.prefix}-func-zips`, {
  ...defaultArgs,
  accountName: storageAccountFunc.name,
}, {
  parent: storageAccountFunc
});

const codeBlob = new storage.Blob(`${options.prefix}-func-zip`, {
  ...defaultArgs,
  accountName: storageAccountFunc.name,
  containerName: codeContainer.name,
  source: new pulumi.asset.FileArchive("./../../dist/main"),
}, {
  parent: codeContainer
});

const plan = new web.AppServicePlan(`${options.prefix}-func-plan`, {
  ...defaultArgs,
}, {
  parent: resourceGroup
});

const storageConnectionFuncString = getConnectionString(resourceGroup.name, storageAccountFunc.name);
const codeBlobUrl = signedBlobReadUrl(codeBlob, codeContainer, storageAccountFunc, resourceGroup);

const app = new web.WebApp(`${options.prefix}-func`, {
  ...defaultArgs,
  serverFarmId: plan.id,
  kind: "functionapp",
  siteConfig: {
    appSettings: [
      { name: "AzureWebJobsStorage", value: storageConnectionFuncString },
      { name: "FUNCTIONS_EXTENSION_VERSION", value: "~3" },
      { name: "FUNCTIONS_WORKER_RUNTIME", value: "node" },
      { name: "WEBSITE_NODE_DEFAULT_VERSION", value: "~14" },
      { name: "WEBSITE_RUN_FROM_PACKAGE", value: codeBlobUrl },

      { name: "EventHubCounterConnection", value: counterConnectionString },
    ],
    http20Enabled: true,
    nodeVersion: "~14",
  },
}, {
  parent: plan
});

export const counterEndpoint = pulumi.interpolate`https://${app.defaultHostName}/api/InCounter?name=Pulumi`;
