import { http, HttpResponse } from 'msw';
import { __createLease } from './createLease';

export function __createLeasesMwsEndpointHandler(expectedUserId: string, expectedApiKey: string) {
  return http.post('https://api.play.ht/api/v2/leases', async ({ request }) => {
    const userId = request.headers.get('x-user-id');
    const authHeader = request.headers.get('authorization');

    expect(userId).toBe(expectedUserId);
    expect(authHeader).toBe(`Bearer ${expectedApiKey}`);

    return new HttpResponse(__createLease(), { headers: { 'Content-Type': 'application/octet-stream' } });
  });
}
