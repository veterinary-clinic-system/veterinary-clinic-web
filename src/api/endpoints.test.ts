import { describe, expect, it } from 'vitest';
import { resolveSocketServerUrl } from './endpoints';

describe('resolveSocketServerUrl', () => {
  it('dùng origin của API tuyệt đối, bỏ qua VITE_WS_URL cũ dính Tab', () => {
    expect(
      resolveSocketServerUrl(
        '\thttps://arrived-responsibilities-applied-ultimately.trycloudflare.com',
        'https://d38c6r9s9iwbo0.cloudfront.net/api/v1',
      ),
    ).toBe('https://d38c6r9s9iwbo0.cloudfront.net');
  });

  it('API tương đối: dùng VITE_WS_URL đã trim', () => {
    expect(resolveSocketServerUrl('  http://localhost:3010/ ', '/api/v1')).toBe(
      'http://localhost:3010',
    );
  });
});
