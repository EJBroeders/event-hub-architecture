import { Context, HttpRequest } from "@azure/functions"

export const makeContext = (): Context => {
  return { 
    invocationId: '0',
    executionContext: {},
    bindings: {},
  };
};

export const makeHttpRequest = (): HttpRequest => {
  return {
  };
};
