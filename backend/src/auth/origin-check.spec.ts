import { createOriginCheck } from './origin-check';

function invoke(method: string, origin?: string) {
  const request = {
    method,
    get: (name: string) => (name === 'origin' ? origin : undefined),
  };
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const next = jest.fn();

  createOriginCheck('https://music.example.test')(request as never, response as never, next);
  return { response, next };
}

describe('createOriginCheck', () => {
  it('rejects a state-changing request from a different browser origin', () => {
    const { response, next } = invoke('DELETE', 'https://attacker.example.test');

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ statusCode: 403, message: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows a state-changing request from the configured frontend', () => {
    const { response, next } = invoke('POST', 'https://music.example.test');

    expect(response.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not block read requests because of a different origin', () => {
    const { response, next } = invoke('GET', 'https://attacker.example.test');

    expect(response.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows requests without Origin for non-browser API clients', () => {
    const { response, next } = invoke('POST');

    expect(response.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
