import { type AggregateBucket } from "@/domain/entities/AggregateBucket";

export interface IAggregateBucketRepository {
  createMany(buckets: AggregateBucket[], uploadId: string): Promise<void>;
  findByLatestUpload(ownerUserId: string): Promise<AggregateBucket[]>;
}
