import {Stack, StackProps} from "aws-cdk-lib";
import {IVpc, Vpc} from "aws-cdk-lib/aws-ec2";
import {Construct} from "constructs";
import {VPC_NAME} from "../constants/Constants";

interface VpcProps extends StackProps{
    vpcId: string;
    vpcName: string;
}

export class VpcStack extends Stack {
    public readonly vpc: IVpc;
    constructor(scope: Construct, id: string, props: VpcProps) {
        super(scope, id, props);

        this.vpc = Vpc.fromLookup(this, VPC_NAME, {
            vpcId: props.vpcId,
            vpcName: props.vpcName,
            isDefault: false,
        });
    }
}