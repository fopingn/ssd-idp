import { Fn } from "cdktf"
import { Alb } from "@cdktf/provider-aws/lib/alb"
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener"
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group"
import { Construct } from "constructs"
import { Tfvars } from "./variables"


export class ClientAlb extends Construct {
    public lb: Alb
    public targetGroup: LbTargetGroup
    public listener: LbListener

    constructor(
        scope: Construct,
        name: string,
        vars: Tfvars,
        subnetsId: string[],
        securityGroupId: string,
        vpcId: string
    ) {
        super(scope, name)

        const nameTagPrefix = `${Fn.lookup(vars.defaultTags, "Learning_project", "")}`

        this.lb = new Alb(this, "client_alb", {
            securityGroups: [securityGroupId],
            namePrefix: "cl-",
            loadBalancerType: "application",
            subnets: subnetsId,
            idleTimeout: 60,
            ipAddressType: "dualstack",
            tags: { Name: `${nameTagPrefix}-client-alb` }
        })

        this.targetGroup = new LbTargetGroup(this, "client_alb_targets", {
            namePrefix: "cl-",
            port: 9090,
            protocol: "HTTP",
            vpcId,
            deregistrationDelay: "30",
            targetType: "ip",

            healthCheck: {
                enabled: true,
                path: "/",
                healthyThreshold: 3,
                unhealthyThreshold: 3,
                timeout: 30,
                interval: 60,
                protocol: "HTTP",
            },

            tags: { Name: `${nameTagPrefix}-client-tg` }
        })

        this.listener = new LbListener(this, "client_alb_http_80", {
            loadBalancerArn: this.lb.arn,
            port: 80,
            protocol: "HTTP",

            defaultAction: [
                {
                    type: "forward",
                    targetGroupArn: this.targetGroup.arn,
                },
            ],
        })
    }
}