import * as azure from "@pulumi/azure";

export type DefaultArgs = {
  tags: { [ key: string ]: string },
  resourceGroupName: string,
  location: string,
};

export default interface Options {
  prefix: string,

  defaultArgs: DefaultArgs,

  resourceGroup: azure.core.ResourceGroup,
  eventHubsNamespace: azure.eventhub.EventHubNamespace,
  storageAccountEventHubsCapture: azure.storage.Account,
};
