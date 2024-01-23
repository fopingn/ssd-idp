import { Construct } from "constructs";
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";
//import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { KmsKeyPolicy } from "@cdktf/provider-aws/lib/kms-key-policy";
import { Fn, Token } from "cdktf";

export class MyKmsKey extends Construct {

    public readonly keyId: string;
    public readonly keyArn: string;
    public readonly keyAliasName: string;
    
    constructor(scope: Construct, name: string) {
        super(scope, name);
        const pipelinekey = new KmsKey(this, "key", {
            description: "My KMS key",
            enableKeyRotation: true,
            keyUsage: "ENCRYPT_DECRYPT"
        })
       this.keyId = pipelinekey.id
       this.keyArn = pipelinekey.arn
       new  KmsKeyPolicy(this, "pipeline_kms_key_policy", {
            keyId: pipelinekey.id,
            policy: Token.asString(
                Fn.jsonencode({
                    Id: "example",
                    Statement: [
                        {
                            Action: "kms:*",
                            Effect: "Allow",
                            Principal: {
                                AWS: "*",
                            },
                            Resource: "*",
                            Sid: "Enable IAM User Permissions",
                        },
                    ],
                    Version: "2012-10-17",
                })

            )
        });
        const codePipelineAlias = new KmsAlias(this, "pipelinekey", {
            name: "alias/pipelinekey",
            targetKeyId: pipelinekey.id
        }        
        )
        this.keyAliasName = codePipelineAlias.name;

                        
    }
}