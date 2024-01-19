
import { Construct } from "constructs";
import { Token,} from "cdktf";
import { Codepipeline } from "@cdktf/provider-aws/lib/codepipeline";
import { CodestarconnectionsConnection } from "@cdktf/provider-aws/lib/codestarconnections-connection";
import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { DataAwsKmsAlias } from "@cdktf/provider-aws/lib/data-aws-kms-alias";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";

class pipeline extends Construct {
    constructor(scope: Construct, name: string) {
        super(scope, name);
        const githubConnnection = new CodestarconnectionsConnection(this, "sso-idp", {
            name: "sso-idp-connection",
            providerType: "GitHub",
        });
        const codepipelineBucket = new S3Bucket(this, "codepipeline_bucket", {
            bucket: "test-bucket",
        });
        new S3BucketPublicAccessBlock(this, "codepipeline_bucket_pab", {
            blockPublicAcls: true,
            blockPublicPolicy: true,
            bucket: codepipelineBucket.id,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        });
        const assumeRole = new DataAwsIamPolicyDocument(this, "assume_role", {
            statement: [
                {
                    actions: ["sts:AssumeRole"],
                    effect: "Allow",
                    principals: [
                        {
                            identifiers: ["codepipeline.amazonaws.com"],
                            type: "Service",
                        },
                    ],
                },
            ],
        });
        const codepipelinePolicy = new DataAwsIamPolicyDocument(
            this,
            "codepipeline_policy",
            {
                statement: [
                    {
                        actions: [
                            "s3:GetObject",
                            "s3:GetObjectVersion",
                            "s3:GetBucketVersioning",
                            "s3:PutObjectAcl",
                            "s3:PutObject",
                        ],
                        effect: "Allow",
                        resources: [
                            codepipelineBucket.arn,
                            "${" + codepipelineBucket.arn + "}/*",
                        ],
                    },
                    {
                        actions: ["codestar-connections:UseConnection"],
                        effect: "Allow",
                        resources: [githubConnnection.arn],
                    },
                    {
                        actions: ["codebuild:BatchGetBuilds", "codebuild:StartBuild"],
                        effect: "Allow",
                        resources: ["*"],
                    },
                ],
            }
        );
        const s3Kmskey = new DataAwsKmsAlias(this, "s3kmskey", {
            name: "alias/myKmsKey",
        });
        const codepipelineRole = new IamRole(this, "codepipeline_role", {
            assumeRolePolicy: Token.asString(assumeRole.json),
            name: "test-role",
        });
        const awsIamRolePolicyCodepipelinePolicy = new IamRolePolicy(
            this,
            "codepipeline_policy_7",
            {
                name: "codepipeline_policy",
                policy: Token.asString(codepipelinePolicy.json),
                role: codepipelineRole.id,
            }
        );
        /*This allows the Terraform resource name to match the original name. You can remove the call if you don't need them to match.*/
        awsIamRolePolicyCodepipelinePolicy.overrideLogicalId("codepipeline_policy");
        new Codepipeline(this, "codepipeline", {
            artifactStore: [
                {
                    encryptionKey: {
                        id: Token.asString(s3Kmskey.arn),
                        type: "KMS",
                    },
                    location: codepipelineBucket.bucket,
                    type: "S3",
                },
            ],
            name: "tf-test-pipeline",
            roleArn: codepipelineRole.arn,
            stage: [
                {
                    action: [
                        {
                            category: "Source",
                            configuration: {
                                BranchName: "main",
                                ConnectionArn: githubConnnection.arn,
                                FullRepositoryId: "my-organization/sso-idp",
                            },
                            name: "Source",
                            outputArtifacts: ["source_output"],
                            owner: "AWS",
                            provider: "CodeStarSourceConnection",
                            version: "1",
                        },
                    ],
                    name: "Source",
                },
                {
                    action: [
                        {
                            category: "Build",
                            configuration: {
                                ProjectName: "test",
                            },
                            inputArtifacts: ["source_output"],
                            name: "Build",
                            outputArtifacts: ["build_output"],
                            owner: "AWS",
                            provider: "CodeBuild",
                            version: "1",
                        },
                    ],
                    name: "Build",
                },
                {
                    action: [
                        {
                            category: "Deploy",
                            configuration: {
                                ActionMode: "REPLACE_ON_FAILURE",
                                Capabilities: "CAPABILITY_AUTO_EXPAND,CAPABILITY_IAM",
                                OutputFileName: "CreateStackOutput.json",
                                StackName: "MyStack",
                                TemplatePath: "build_output::sam-templated.yaml",
                            },
                            inputArtifacts: ["build_output"],
                            name: "Deploy",
                            owner: "AWS",
                            provider: "CloudFormation",
                            version: "1",
                        },
                    ],
                    name: "Deploy",
                },
            ],
        });
    }
}