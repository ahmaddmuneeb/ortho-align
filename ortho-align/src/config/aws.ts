import { S3Client } from '@aws-sdk/client-s3';

export function getAwsRegion(): string {
  return process.env.AWS_REGION || 'us-east-1';
}

export function getS3BucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET_NAME?.trim();
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET_NAME is not configured');
  }
  return bucket;
}

export function isS3Configured(): boolean {
  return Boolean(process.env.AWS_S3_BUCKET_NAME?.trim() && getAwsRegion());
}

export function createS3Client(): S3Client {
  const region = getAwsRegion();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  // EC2 instance profile / default credential chain
  return new S3Client({ region });
}

export function buildS3PublicUrl(key: string): string {
  const bucket = getS3BucketName();
  return `https://${bucket}.s3.${getAwsRegion()}.amazonaws.com/${key}`;
}
