//Amazon ECS uses a service-linked role to call other AWS services on your behalf.
import { Construct } from "constructs";
//import { IamServiceLinkedRole } from "@cdktf/provider-aws/lib/iam-service-linked-role";
import { EcsCluster } from "@cdktf/provider-aws/lib/ecs-cluster";
import { EcsClusterCapacityProviders } from "@cdktf/provider-aws/lib/ecs-cluster-capacity-providers";


// export class EcsIamLinkedRole extends Construct {

//    public readonly ecsServiceRoleName: string;
//     constructor(scope: Construct, name: string) {
//         super(scope, name);
//         const ecslinkedrole = new IamServiceLinkedRole(this, "ecs_service_linked_role", {
//             awsServiceName: "ecs.amazonaws.com"})
//         this.ecsServiceRoleName = ecslinkedrole.name;
// }
// }

// a ecs fargate cluster 
export class MyEcsCluster extends Construct {
    public readonly ecsClusterName: string;
    constructor(scope: Construct, name: string) {
        super(scope, name);

        const ecsCluster = new EcsCluster(this, "ecs_cluster", {
            name: "idp-ecs-cluster"
        });
        this.ecsClusterName = ecsCluster.name;

        new EcsClusterCapacityProviders(this, "ecs_cluster_capacity_provider", {
            capacityProviders: ["FARGATE"],
            clusterName: ecsCluster.name,
            defaultCapacityProviderStrategy: [
                {
                    base: 1,
                    capacityProvider: "FARGATE",
                    weight: 100,
                },
            ],
        });
         
    }

}

