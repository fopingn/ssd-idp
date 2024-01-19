// cdktf code for Security group creation for each subnet with the following karacteristics 
// one for each subnet
// All security groups should allow egress for all protocols to all addresses. --> default rule apply to all
// All security groups should allow ingress with itself. --> self rule 
// The public security group should allow ingress from ports 80 and 443 from any IPs.
// The app security group should allow ingress from the public security group.
// The data security group should allow ingress from the app security group.
// Export the security groups to make them available outside the stack.

import { Construct } from "constructs";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group-rule";
import { Fn } from "cdktf";
import { Tfvars } from "./variables";

export class SecurityGroups extends Construct {

    public publicSubSgId: SecurityGroup;
    public applicationSubSgId: SecurityGroup;
    public databaseSubSgId: SecurityGroup;
    constructor(
        scope: Construct, 
        name: string, 
        vars: Tfvars,
        vpcId: string) {
        super(scope, name);
        const nameTagPrefix = `${Fn.lookup(vars.defaultTags, "project", "")}`
        
        // const sg_names = ["pubSg", "appSg", "dbSg"]
        // this.securityGroupIds = this.createSecurityGroup(vpcId, sg_names);

        // reusable egress rule 
        const allowAllEgress = (
            securityGroupId: string,
            constructId: string
        ) => (
            new SecurityGroupRule(this, constructId, {
                type: "egress",
                fromPort: 0,
                toPort: 0,
                protocol: "-1",
                cidrBlocks: ["0.0.0.0/0"],
                securityGroupId,
                description: "Allow any outbound traffic",}
        )
        )

        // reusable ingress rule from itself
        const allowselfIngress = (
            securityGroupId: string,
            constructId: string            
             ) => (
                new SecurityGroupRule(this, constructId, {
                    selfAttribute: true,
                    securityGroupId,
                    fromPort: 0,
                    toPort: 0,
                    protocol: '-1',
                    type: 'ingress',
                    description: "Allow any outbound traffic from others with same security group"
                })

            )

        // reusable ingress 80 rule
        const allowIngress80 = (
            securityGroupId: string,
            constructId: string
        ) => (
            new SecurityGroupRule(this, constructId, {
                securityGroupId,
                type: "ingress",
                protocol: "tcp",
                fromPort: 80,
                toPort: 80,
                cidrBlocks: ["0.0.0.0/0"],
                ipv6CidrBlocks: ["::/0"],
                description: "Allow HTTP traffic",
            })
        )

        // reusable ingress 80 rule
        const allowIngress443 = (
            securityGroupId: string,
            constructId: string
        ) => (
            new SecurityGroupRule(this, constructId, {
                securityGroupId,
                type: "ingress",
                protocol: "tcp",
                fromPort: 443,
                toPort: 443,
                cidrBlocks: ["0.0.0.0/0"],
                ipv6CidrBlocks: ["::/0"],
                description: "Allow HTTP traffic",
            })
        )

        // Client Application Load Balancer Security Group and Rules
        this.publicSubSgId = new SecurityGroup(this, "client_alb_security_group", {
            namePrefix: `${nameTagPrefix}-public-subnet-sg-id`,
            description: "security group for public subnet",
            vpcId,
        })
        allowIngress80(this.publicSubSgId.id, "public_sub_allow_80")
        allowIngress443(this.publicSubSgId.id, "public_sub_allow_443")
        allowAllEgress(this.publicSubSgId.id, "public_sub_allow_outbound")
        allowselfIngress(this.publicSubSgId.id, "public_sub_allow_self_ingress")

        // application subnet sg definition
        this.applicationSubSgId = new SecurityGroup(this, "application_security_group", {
            namePrefix: `${nameTagPrefix}-application-subnet-sg-id`,
            description: "security group for application subnet",
            vpcId,
        })
        //application security group should allow all traffic from public subnet security group 
        new SecurityGroupRule(this, "application_sub_allow_ingress", {
            securityGroupId: this.applicationSubSgId.id,
            type: "ingress",
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            sourceSecurityGroupId: this.publicSubSgId.id,
            description: "Allow all traffic from public subnet security group",
        })

        allowAllEgress(this.applicationSubSgId.id, "application_sub_allow_outbound")
        allowselfIngress(this.applicationSubSgId.id, "application_sub_allow_self_ingress")
        
        // database subnet sg definition
        this.databaseSubSgId = new SecurityGroup(this, "database_security_group", {
            namePrefix: `${nameTagPrefix}-database-subnet-sg-id`,
            description: "security group for database subnet",
            vpcId,
        })
        // The data security group rule to allow ingress from the app security group.
        new SecurityGroupRule(this, "database_sub_allow_ingress", {
            securityGroupId: this.databaseSubSgId.id,
            type: "ingress",
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            sourceSecurityGroupId: this.applicationSubSgId.id,
            description: "Allow all traffic from application subnet security group",
        })

        allowAllEgress(this.databaseSubSgId.id, "database_sub_allow_outbound")
        allowselfIngress(this.databaseSubSgId.id, "database_sub_allow_self_ingress")
      

}

//     public createSecurityGroup(vpcId: string, sg_names: string[]): string[] {
//         const securityGroupIds: string[] = [];
//         let count = 0;

//         sg_names.forEach((sg_name) => {
//             count++;
//             const s = new SecurityGroup(this, `sg${count}`, {
//                 vpcId: vpcId,
//                 name: `${sg_name}${count}`,
//                 tags: {
//                     Name: `${sg_name}${count}`,
//                 },
//             });
//             securityGroupIds.push(s.id);
//         });

//         return securityGroupIds;
//     }

}
