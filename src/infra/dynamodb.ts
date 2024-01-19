// dynamodb table with simple primary key usiing the string attribute "environment"
import { Construct } from "constructs";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import * as random from "@cdktf/provider-random";


export class MyDynamodbTable extends Construct {

    public readonly dynamoDbName: string;
    constructor(scope: Construct, name: string) {
        super(scope, name);
        
        new random.provider.RandomProvider(this, "random")
        const pet = new random.pet.Pet(this, "pet", {
            length: 3,} )

        const dynamodb = new DynamodbTable(this, "example", {
            attribute: [
                {
                    name: "environment",
                    type: "S",
                },
            ],
            billingMode: "PAY_PER_REQUEST",
            hashKey: "environment",
            name: `dynamodbTable-${pet.id}`
        })
        this.dynamoDbName = dynamodb.name
    }
}
