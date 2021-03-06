import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

const prefix = `${pulumi.getProject()}-${pulumi.getStack()}`.toLowerCase();

const resourceGroup = new azure.core.ResourceGroup(`${prefix}-rg`, {
  tags: {
    project: pulumi.getProject(),
    environment: pulumi.getStack(),
  },
});


