import { FetchRequest, FetchResponse } from './constants';
import RESTManager from './RESTManager';

test('fetch returns the correct response', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(RESTManager.prototype as any, 'internalFetch').mockImplementation(() =>
    Promise.resolve({
      status: {
        code: 200,
        message: 'Success',
      },
      data: '{"success": true}',
      headers: {},
    } as FetchResponse),
  );

  const rest = new RESTManager();
  const response = await rest.fetch({
    path: '/api/test',
  });
  const data = JSON.parse(response.data);
  expect(response.status.code).toBe(200);
  expect(data).toStrictEqual({ success: true });

  jest.restoreAllMocks();
});

test('conversion to internal request is correct', () => {
  const rest = new RESTManager({ baseURL: 'https://localhost:3000/api', baseHeaders: { Authorization: 'token' } });
  const rawRequest = {
    path: '/test?x=1',
  } as FetchRequest;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const req = (rest as any).convertToInternalRequest(rawRequest);
  expect(req).toStrictEqual({
    hostname: 'localhost',
    port: '3000',
    path: '/api/test?x=1',
    method: 'GET',
    headers: {
      Authorization: 'token',
    },
  });
});
