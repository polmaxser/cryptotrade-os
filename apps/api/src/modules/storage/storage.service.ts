import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

@Injectable()
export class StorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string | undefined;
  private readonly publicUrlBase: string | undefined;
  private bucketEnsured = false;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('storage.endpoint');
    const region = this.configService.get<string>('storage.region', 'us-east-1');
    const accessKeyId = this.configService.get<string>('storage.accessKeyId');
    const secretAccessKey = this.configService.get<string>('storage.secretAccessKey');
    const forcePathStyle = this.configService.get<boolean>('storage.forcePathStyle', false);

    this.bucket = this.configService.get<string>('storage.bucket');
    this.publicUrlBase = this.configService.get<string>('storage.publicUrlBase');

    this.client =
      accessKeyId && secretAccessKey && this.bucket
        ? new S3Client({
            endpoint,
            region,
            forcePathStyle,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async uploadImage(buffer: Buffer, contentType: string, keyPrefix: string): Promise<string> {
    if (!this.client || !this.bucket) {
      throw new ServiceUnavailableException('File storage is not configured yet');
    }

    await this.ensureBucket();

    const extension = contentType.split('/')[1] ?? 'bin';
    const key = `${keyPrefix}/${randomUUID()}.${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return this.publicUrlBase ? `${this.publicUrlBase}/${key}` : key;
  }

  async deleteByUrl(url: string): Promise<void> {
    if (!this.client || !this.bucket || !this.publicUrlBase) return;
    if (!url.startsWith(this.publicUrlBase)) return;

    const key = url.slice(this.publicUrlBase.length + 1);

    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  /**
   * Auto-creates and opens up the bucket the first time it's missing — this only
   * fires for a fresh local/self-hosted store (MinIO). A real production bucket
   * is expected to already exist, in which case HeadBucket succeeds immediately
   * and this never touches bucket policy — provisioning and public access for a
   * real bucket is an infra/ops decision, not something the app should mutate.
   */
  private async ensureBucket(): Promise<void> {
    if (this.bucketEnsured || !this.client || !this.bucket) return;

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `arn:aws:s3:::${this.bucket}/*`,
              },
            ],
          }),
        }),
      );
    }

    this.bucketEnsured = true;
  }
}
