import * as eventhub from "@pulumi/azure-native/eventhub";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";

export type DefaultArgs = {
  tags: { [ key: string ]: string },
  resourceGroupName: string,
  location: string,
};

export default interface Options {
  prefix: string,

  defaultArgs: DefaultArgs,

  resourceGroup: resources.ResourceGroup,
  eventHubsNamespace: eventhub.Namespace,
  storageAccountEventHubsCapture: storage.StorageAccount,
};
