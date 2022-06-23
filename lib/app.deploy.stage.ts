import {StackProps, Stage} from "aws-cdk-lib";
import {Construct} from "constructs";

interface Props extends Stage{

}

export class AppDeployStage extends Stage{
    constructor(scope:Construct, id:string, props:Props) {
        super(scope, id, props);


    }

}