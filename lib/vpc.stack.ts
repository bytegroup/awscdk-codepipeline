import {Stack, StackProps} from "aws-cdk-lib";
import {IVpc, Vpc} from "aws-cdk-lib/aws-ec2";
import {Construct} from "constructs";
import {VPC_ID, VPC_NAME} from "../constants/Constants";

export class VpcStack extends Stack {
    public readonly vpc: IVpc;
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.vpc = Vpc.fromLookup(this, VPC_NAME, {
            vpcId: VPC_ID,
            vpcName: VPC_NAME,
            isDefault: false,
        });
    }
}