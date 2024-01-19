import { Tfvars } from "./variables";
import { Construct } from "constructs";
import { Fn } from "cdktf";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";

export class Network extends Construct {

  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly applicationSubnetIds: string[];
  public readonly databaseSubnetIds: string[];

  constructor(scope: Construct, id: string, vars: Tfvars) {
    super(scope, id);

    //const vpcCidr = "10.1.0.0/16";
    // const basePublicSubnetCidr = "10.1.0.0/22"
    // const baseApplicationSubnetCidr = "10.1.4.0/22"
    // const baseDatabaseSubnetCidr = "10.1.8.0/22"
    const netnums = [0, 1, 2];
    const subnetBits = 2
    const publicSubnets = this.generateCidrSubnets(vars.basePublicSubnetCidr, subnetBits, netnums);
    const applicationSubnets = this.generateCidrSubnets(vars.baseApplicationSubnetCidr, subnetBits, netnums);
    const databaseSubnets = this.generateCidrSubnets(vars.baseDatabaseSubnetCidr, subnetBits, netnums);

    const vpc = new Vpc(this, "vpc", {
      cidrBlock: vars.vpcCidr,
    });

    this.vpcId = vpc.id;
    this.applicationSubnetIds = this.buildSubnets(vpc.id, applicationSubnets, "application");
    this.publicSubnetIds = this.buildSubnets(vpc.id, publicSubnets, "public");
    this.databaseSubnetIds = this.buildSubnets(vpc.id, databaseSubnets, "database");
    this.buildGatewaysAndRoutes(this.publicSubnetIds, this.applicationSubnetIds, vpc.id);
  }

  private buildSubnets(
    vpcId: string,
    subnets: string[],
    subnetType: string
  ): string[] {
    const subnetIds: string[] = [];

    let count = 0;

    subnets.forEach((subnet) => {
      count++;
      const s = new Subnet(this, `${subnetType}${count}`, {
        vpcId: vpcId,
        cidrBlock: subnet,
        availabilityZone: `us-east-1${(count + 9).toString(36)}`,
        tags: {
          Name: `${subnetType}${count}`,
        },
      });
      subnetIds.push(s.id);
    });

    return subnetIds;
  }

  private generateCidrSubnets(baseCidr: string, subnetBits: number, netnums: number[]): string[] {
    return netnums.map((netnum: number) => Fn.cidrsubnet(baseCidr, subnetBits, netnum));
  }

  private buildGatewaysAndRoutes(
    publicSubnetIds: string[],
    applicationSubnetIds: string[],
    vpcId: string
  ) {
    const gateway = new InternetGateway(this, "internet-gateway", {
      vpcId: vpcId,
    });

    const publicRt = new RouteTable(this, "route-table-public", {
      vpcId: vpcId,
      route: [
        {
          cidrBlock: "0.0.0.0/0",
          gatewayId: gateway.id,
        },
      ],
    });

    let count = 0;
    publicSubnetIds.forEach((id) => {
      count++;
      const eip = new Eip(this, `eip-${count}`, {
        vpc: true,
      });

      const gw = new NatGateway(this, `nat-gateway-${count}`, {
        allocationId: eip.allocationId,
        subnetId: id,
      });

      new RouteTableAssociation(
        this,
        `route-table-association-public-${count}`,
        {
          routeTableId: publicRt.id,
          subnetId: id,
        }
      );

      // Private Route Table
      const rt = new RouteTable(this, `route-table-private-${count}`, {
        vpcId: vpcId,
        route: [
          {
            cidrBlock: "0.0.0.0/0",
            natGatewayId: gw.id,
          },
        ],
      });

      new RouteTableAssociation(
        this,
        `route-table-association-private-${count}`,
        {
          routeTableId: rt.id,
          subnetId: applicationSubnetIds[count - 1],
        }
      );
    });
  }
}


