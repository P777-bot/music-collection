import type { RequestHandler } from 'express';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function createOriginCheck(frontendOrigin: string): RequestHandler {
  return (request, response, next) => {
    const origin = request.get('origin');

    if (STATE_CHANGING_METHODS.has(request.method) && origin && origin !== frontendOrigin) {
      response.status(403).json({ statusCode: 403, message: 'Forbidden' });
      return;
    }

    next();
  };
}
