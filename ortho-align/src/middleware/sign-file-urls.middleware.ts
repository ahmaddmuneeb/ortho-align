import { Request, Response, NextFunction } from 'express';
import { S3Service } from '../services/s3.service';

async function signDeep(value: unknown): Promise<unknown> {
  if (Array.isArray(value)) {
    return Promise.all(value.map(signDeep));
  }

  if (value && typeof value === 'object') {
    // Date, Prisma Decimal, etc. serialize themselves via toJSON — walking their
    // (non-enumerable) internals would otherwise flatten them to `{}`.
    if (typeof (value as { toJSON?: unknown }).toJSON === 'function') {
      return value;
    }

    const entries = await Promise.all(
      Object.entries(value as Record<string, unknown>).map(async ([key, val]) => {
        if (key === 'fileUrl' && typeof val === 'string') {
          return [key, await S3Service.getSignedUrl(val)];
        }
        return [key, await signDeep(val)];
      }),
    );
    return Object.fromEntries(entries);
  }

  return value;
}

/**
 * Case files, comment attachments, clarification attachments, etc. are all stored
 * as `fileUrl` on a private S3 bucket. This intercepts outgoing JSON responses and
 * swaps every `fileUrl` for a short-lived presigned URL, so individual routes/services
 * don't each need to remember to sign before responding.
 */
export function signFileUrls(_req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    signDeep(body)
      .then((signedBody) => originalJson(signedBody))
      .catch((error) => {
        console.error('Failed to sign file URLs in response:', error);
        originalJson(body);
      });
    return res;
  }) as Response['json'];

  next();
}
