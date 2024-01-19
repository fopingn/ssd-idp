import * as cdktf from "cdktf"
import { Construct } from "constructs"

export class Tfvars extends Construct {
    public defaultTags?: { [key: string]: string }
    public vpcCidr: string
    public defaultRegion: string
    public basePublicSubnetCidr: string
    public baseApplicationSubnetCidr: string
    public baseDatabaseSubnetCidr: string
    public ec2InstanceType: string
    


    constructor(scope: Construct, name: string) {
        super(scope, name)

        this.defaultRegion = "us-east-1"

        this.defaultTags = new cdktf.TerraformVariable(this, "default_tags", {
            default: {
                project: "ssd-idp-liveproject",
            },
            description: "Map of default tags to apply to resources",
        }).value

        this.vpcCidr = new cdktf.TerraformVariable(this, "vpc_cidr", {
            default: "10.1.0.0/16",
            description: "CIDR block for VPC",
        }).value

        this.baseApplicationSubnetCidr = new cdktf.TerraformVariable(this, "base_application_subnet_cidr", {
            default: "10.1.4.0/22",
            description: "CIDR block for application subnet",
        }).value

        this.basePublicSubnetCidr = new cdktf.TerraformVariable(this, "base_public_subnet_cidr", {
            default: "10.1.0.0/22",
            description: "CIDR block for public subnet",
        }).value

        this.baseDatabaseSubnetCidr = new cdktf.TerraformVariable(this, "base_database_subnet_cidr", {
            default: "10.1.8.0/22",
            description: "CIDR block for database subnet",
        }).value
        this.ec2InstanceType = new cdktf.TerraformVariable(this, "ec2_instance_type", {
            default: "t2.micro",
            description: "EC2 instance type",
        }
        ).value 
        
    }
}
