import { Instance } from "@cdktf/provider-aws/lib/instance"
//import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway"
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami"
import { Fn } from "cdktf"
import { Construct } from "constructs"
import { Tfvars } from "./variables"
//import { readFileSync } from 'fs'

export class Ec2Instance extends Construct {
    public instance: Instance
    constructor(
        scope: Construct,
        name: string,
        vars: Tfvars,
        subnetId: string,
        securityGroupId: string,
       // natGateway: NatGateway
    ) {
        super(scope, name)

        const nameTagPrefix = `${Fn.lookup(vars.defaultTags, "project", "")}`
        
        const ami = new DataAwsAmi(this, 'latest-amazon-linux-2-ami', {
            mostRecent: true,
            owners: ["amazon"],
            filter: [{
                name: 'name',
                values: ['amzn2-ami-hvm-*-gp2']
            }]
        })

        this.instance = new Instance(this, name, {
            ami: ami.id,
            instanceType: vars.ec2InstanceType,
            vpcSecurityGroupIds: [securityGroupId],
            subnetId,
            tags: { Name: `${nameTagPrefix}-ec2` },
            //dependsOn: [natGateway],
            //userData: readFileSync('./scripts/database.sh', 'utf8')
        })
    }
}