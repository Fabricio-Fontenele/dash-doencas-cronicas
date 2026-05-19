import { CareEventBucket } from "@/domain/entities/CareEventBucket";

export interface ICareEventBucketRepository {
  createMany(buckets: CareEventBucket[], uploadId: string): Promise<void>;
  findByLatestUpload(): Promise<CareEventBucket[]>;
}
