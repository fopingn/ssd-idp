import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketServerSideEncryptionConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { Fn } from "cdktf";
import { Construct } from "constructs";
import { Tfvars } from "./variables";


export class MyS3Bucket extends Construct {
    public readonly bucketArn: string;
    public readonly bucketName: string;
    constructor(scope: Construct,
        name: string,
        vars: Tfvars,
        kmskeyid: string,
        ) {
        super(scope, name);
        const nameTagPrefix = `${Fn.lookup(vars.defaultTags, "project", "")}`
        const myS3Bucket = new S3Bucket(this, "s3_bucket", {
            bucket: `${nameTagPrefix}-s3-bucket`,
            acl: "private",
            forceDestroy: true,

        });
        this.bucketArn = myS3Bucket.arn;
        this.bucketName = myS3Bucket.id;

        new S3BucketServerSideEncryptionConfigurationA(this, "example", {
            bucket: myS3Bucket.id,
            rule: [
                {
                    applyServerSideEncryptionByDefault: {
                        kmsMasterKeyId: kmskeyid,
                        sseAlgorithm: "aws:kms",
                    },
                },
            ],
        });
 

        new S3BucketPublicAccessBlock(this, "codepipeline_bucket_pab", {
            blockPublicAcls: true,
            blockPublicPolicy: true,
            bucket: myS3Bucket.id,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        });
    }


    }

