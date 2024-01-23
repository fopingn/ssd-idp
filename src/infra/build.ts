import { Construct } from "constructs";
// import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
// import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";
//import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
// import { KmsKeyPolicy } from "@cdktf/provider-aws/lib/kms-key-policy";
import { Fn, Token } from "cdktf";
import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";
import { CodebuildProject } from "@cdktf/provider-aws/lib/codebuild-project";
import { Tfvars } from "./variables";


export class MyCodeBuild extends Construct {

    public readonly buildProjectName: string;
    // public readonly keyArn: string;
    // public readonly keyAliasName: string;
    
    constructor(scope: Construct, 
        name: string,
        vars: Tfvars,
        // subnetId: string,
        // securityGroupId: string,
        // vpcId: string,
        codeSourceLocation: string,
        sourceVersionBranch: string,
        pipelineArtifactS3Arn: string,
        
        ) {
        super(scope, name);
        const nameTagPrefix = `${Fn.lookup(vars.defaultTags, "project", "")}`
        const assumeRole = new DataAwsIamPolicyDocument(this, "build_assume_role", {
            statement: [
                {
                    actions: ["sts:AssumeRole"],
                    effect: "Allow",
                    principals: [
                        {
                            identifiers: ["codebuild.amazonaws.com"],
                            type: "Service",
                        },
                    ],
                },
            ],
        });
        const dataAwsIamPolicyDocumentExample = new DataAwsIamPolicyDocument(
            this,
            "codebuild_policy",
            {
                statement: [
                    {
                        actions: [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                        ],
                        effect: "Allow",
                        resources: ["*"],
                    },
                    // Access to pipeline bucket 
                    {
                        actions: [
                            "s3:PutObject",
                            "s3:GetObject",
                            "s3:GetObjectVersion",
                            "s3:GetBucketAcl",
                            "s3:GetBucketLocation"
                        ],
                        effect: "Allow",
                        resources: [ pipelineArtifactS3Arn, `${pipelineArtifactS3Arn}/*`]
                    },
                    {
                        // To allow VPC integration with codebuild
                        actions: [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeDhcpOptions",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface",
                            "ec2:DescribeSubnets",
                            "ec2:DescribeSecurityGroups",
                            "ec2:DescribeVpcs",
                            "ec2:DescribeVpcAttribute",
                            "ec2:DisassociateIamInstanceProfile",
                            "ec2:DescribeVolumes",
                            "ec2:DescribeIamInstanceProfileAssociations",
                            "ec2:TerminateInstances",
                            "ec2:ModifyInstanceAttribute",
                            "ec2:DescribeTags",
                            "ec2:DescribeInstances",
                            "ec2:DescribeInstanceTypes",
                            "ec2:DescribeInstanceAttribute",
                            "ec2:DescribeInstanceCreditSpecifications"
                        ],
                        effect: "Allow",
                        resources: ["*"],
                    },
                    // parameter store access 
                    {
                        actions: [
                            "ssm:GetParameters",
                            "ssm:GetParameter",
                            "ssm:PutParameter",
                            "ssm:DeleteParameter",
                            "ssm:ListTagsForResource",
                            "ssm:AddTagsToResource",
                            "ssm:RemoveTagsFromResource"
                        ],
                        effect: "Allow",
                        resources: ["*"],
                    },

                    // Permission to push image on ECR
                    {
                        actions: [
                            "ecr:GetAuthorizationToken",
                            "ecr:BatchGetImage",
                            "ecr:GetDownloadUrlForLayer",
                            "ecr:CompleteLayerUpload",
                            "ecr:UploadLayerPart",
                            "ecr:InitiateLayerUpload",
                            "ecr:BatchCheckLayerAvailability",
                            "ecr:PutImage",
                            "ecr:DescribeImages"
                        ],
                        effect: "Allow",
                        resources: ["*"],
                    }
                    

                    
                ],
            }
        );
        /*This allows the Terraform resource name to match the original name. You can remove the call if you don't need them to match.*/
        dataAwsIamPolicyDocumentExample.overrideLogicalId("codebuild_policy");
        const awsIamRoleExample = new IamRole(this, "codebuild_role", {
            assumeRolePolicy: Token.asString(assumeRole.json),
            name: `${nameTagPrefix}-codebuild-role`,
        });
        /*This allows the Terraform resource name to match the original name. You can remove the call if you don't need them to match.*/
        awsIamRoleExample.overrideLogicalId("codebuild_role");
        const awsIamRolePolicyExample = new IamRolePolicy(this, "codebuild_role_attachment", {
            policy: Token.asString(dataAwsIamPolicyDocumentExample.json),
            role: Token.asString(awsIamRoleExample.name),
        });
        /*This allows the Terraform resource name to match the original name. You can remove the call if you don't need them to match.*/
        awsIamRolePolicyExample.overrideLogicalId("codebuild_role_attachment");

        ////// codebuild project definition //////
        const awsCodebuildProjectExample = new CodebuildProject(this, "codebuild_project", {
            artifacts: {
                type: "CODEPIPELINE",
            },
            buildTimeout: 5,
            // cache: {
            //     location: example.bucket,
            //     type: "S3",
            // },
            description: "ssd-idp_codebuild_project",
            environment: {
                computeType: "BUILD_GENERAL1_SMALL",
                // environmentVariable: [
                //     {
                //         name: "SOME_KEY1",
                //         value: "SOME_VALUE1",
                //     },
                //     {
                //         name: "SOME_KEY2",
                //         type: "PARAMETER_STORE",
                //         value: "SOME_VALUE2",
                //     },
                // ],
                image: "aws/codebuild/amazonlinux2-x86_64-standard:4.0",
                imagePullCredentialsType: "CODEBUILD",
                type: "LINUX_CONTAINER",
            },
            logsConfig: {
                cloudwatchLogs: {
                    groupName: "log-group",
                    streamName: "log-stream",
                },
                // s3Logs: {
                //     location: "${" + example.id + "}/build-log",
                //     status: "ENABLED",
                // },
            },
            name: `${nameTagPrefix}-codebuild-project`,
            serviceRole: awsIamRoleExample.arn, //Token.asString(awsIamRoleExample.arn),
            source: {
                gitCloneDepth: 1,
                gitSubmodulesConfig: {
                    fetchSubmodules: true,
                },
                location: codeSourceLocation,
                type: "CODEPIPELINE",
                buildspec: "buildspec.yml",
            },
            sourceVersion: sourceVersionBranch,
            tags: {
                Environment: "development",
            },
            // vpcConfig: {
            //     securityGroupIds: [securityGroupId] 
            //     ,
            //     subnets: [subnetId],
            //     vpcId: vpcId,
            // },
        });
        this.buildProjectName = awsCodebuildProjectExample.name;
        /*This allows the Terraform resource name to match the original name. You can remove the call if you don't need them to match.*/
        awsCodebuildProjectExample.overrideLogicalId("codebuild_project");        
        
    }
}