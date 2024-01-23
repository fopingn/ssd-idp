import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider"
import { MyPipeline } from "./infra/pipeline";
import { MyCodeBuild } from "./infra/build";
import { Tfvars } from "./infra/variables";
import { MyKmsKey } from "./infra/kms";
import { MyS3Bucket } from "./infra/s3";



export class EcsPipeline extends TerraformStack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        new AwsProvider(this, "aws", {
            region: "us-east-1",
        });
        const vars = new Tfvars(this, "main");

        const artifactstorekmskey = new MyKmsKey(this, "pipeline_artifact_s3_kmskey")

        const s3forpipelineartifact = new MyS3Bucket(this, "pipeline_artifact_s3_bucket", vars, artifactstorekmskey.keyId)

        const ssdipd = new MyCodeBuild(this, "ecs_build", vars, "https://github.com/fopingn/ssd-idp.git", "main", s3forpipelineartifact.bucketArn);

        new MyPipeline(this, "ecs_pipeline", vars, ssdipd.buildProjectName, s3forpipelineartifact.bucketArn, s3forpipelineartifact.bucketName, artifactstorekmskey.keyId );

    }
}

const app = new App();
new EcsPipeline(app, "ssd-idp-pipeline");
app.synth();
