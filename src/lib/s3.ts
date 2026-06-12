// S3 com27 upload helper. Explicit S3_REGION usage — Vercel injects
// AWS_REGION=us-east-1, which would silently mis-target our eu-west-2
// bucket. The fleet pattern (per the appai project's hard-won lesson)
// is to prefer S3_REGION and ignore AWS_REGION.

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "./env";

let _s3: S3Client | null = null;
function client(): S3Client {
  if (_s3) return _s3;
  const s = env.s3();
  if (!s.accessKey || !s.secretKey) throw new Error("S3_ACCESS_KEY / S3_SECRET_ACCESS_KEY missing");
  _s3 = new S3Client({
    region: s.region,
    credentials: { accessKeyId: s.accessKey, secretAccessKey: s.secretKey },
  });
  return _s3;
}

export interface UploadResult {
  key: string;
  url: string;
  bytes: number;
  contentType: string;
}

export async function uploadBuffer(opts: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<UploadResult> {
  const s = env.s3();
  const cli = client();
  await cli.send(
    new PutObjectCommand({
      Bucket: s.bucket,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return {
    key: opts.key,
    url: `${s.publicBase.replace(/\/+$/, "")}/${opts.key}`,
    bytes: opts.body.length,
    contentType: opts.contentType,
  };
}

export function s3Key(parts: string[]): string {
  const s = env.s3();
  return [s.prefix, ...parts].filter(Boolean).join("/");
}
