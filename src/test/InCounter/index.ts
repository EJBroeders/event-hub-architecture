import { makeContext, makeHttpRequest } from '../helpers';

import httpTrigger from './../../main/InCounter';

test('Should return 400 if called without a name', async () => {
  const context = makeContext();
  const httpRequest = makeHttpRequest();

  await httpTrigger(context, httpRequest);

  expect(context.res.status).toBe(400);
});
