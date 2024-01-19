import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider"
import { Network } from "./infra/network";
import { SecurityGroups } from "./infra/sg";
import { MyEcsCluster, } from "./infra/ecs";
import { MyDynamodbTable } from "./infra/dynamodb";
import { Tfvars } from "./infra/variables";
//import { ClientAlb } from "./infra/ecs-alb";
import { Ec2Instance } from "./infra/ec2-instance";


export class EcsStack extends TerraformStack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        new AwsProvider(this, "aws", {
            region: "us-east-1",
        });
      const vars = new Tfvars(this, "main");
      const network = new  Network(this, "ecs_network", vars);
      const securitygroups = new SecurityGroups(this, "security_group", vars, network.vpcId);
      //new EcsIamLinkedRole(this, "iam_ecs_linked");
      new MyEcsCluster(this, "ecs_cluster");
      new Ec2Instance(this, "ec2_instance", vars, network.publicSubnetIds[0], securitygroups.publicSubSgId.id);
      //new ClientAlb(this, "ecs_alb", vars, network.publicSubnetIds, securitygroups.publicSubSgId.id, network.vpcId);
      new MyDynamodbTable(this, "dynamodb");
    }
}

const app = new App();
new EcsStack(app, "ssd-idp-liveproject");
app.synth();
