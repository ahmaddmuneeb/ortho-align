import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as presignUrl } from '@aws-sdk/s3-request-presigner';
import { FileCategory } from '@prisma/client';
import {
  buildS3PublicUrl,
  createS3Client,
  getS3BucketName,
} from '../config/aws';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

const s3Client = createS3Client();
const BUCKET_NAME = () => getS3BucketName();

export class S3Service {
  static async uploadBuffer(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME(),
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return buildS3PublicUrl(key);
  }

  static async uploadFile(
    file: Express.Multer.File,
    caseId: string,
    category: FileCategory,
  ): Promise<{ fileUrl: string; fileName: string }> {
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `cases/${caseId}/${category.toLowerCase()}/${timestamp}-${sanitizedFileName}`;

    const fileUrl = await S3Service.uploadBuffer(key, file.buffer, file.mimetype);

    return {
      fileUrl,
      fileName: file.originalname,
    };
  }

  static async deleteFile(fileUrl: string): Promise<void> {
    const key = fileUrl.split('.amazonaws.com/')[1];

    if (!key) {
      throw new Error('Invalid file URL');
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME(),
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * The bucket is private, so `fileUrl` (as stored) is not directly fetchable.
   * Swap it for a short-lived presigned GET URL before sending it to a client.
   */
  static async getSignedUrl(fileUrl: string): Promise<string> {
    const key = fileUrl.split('.amazonaws.com/')[1];
    if (!key) return fileUrl;

    try {
      const command = new GetObjectCommand({ Bucket: BUCKET_NAME(), Key: key });
      return await presignUrl(s3Client, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
    } catch (error) {
      console.error('Failed to sign S3 URL:', error);
      return fileUrl;
    }
  }

  static getCategoryFromString(category: string): FileCategory | null {
    const upperCategory = category.toUpperCase();
    if (Object.values(FileCategory).includes(upperCategory as FileCategory)) {
      return upperCategory as FileCategory;
    }
    return null;
  }

  static validateFileType(mimetype: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/dicom',
      'model/stl',
      'application/sla',
    ];
    return allowedTypes.includes(mimetype);
  }

  static validateFileSize(size: number): boolean {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    return size <= MAX_FILE_SIZE;
  }
}
