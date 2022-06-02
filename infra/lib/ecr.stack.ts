import {RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {IRepository, Repository} from "aws-cdk-lib/aws-ecr";
import {Construct} from "constructs";
import {APP} from "../constants/Constants";

export class EcrStack extends Stack {
    public readonly repository: IRepository;

    constructor(app: Construct, id: string, props: StackProps) {
        super(app, id, props);
        this.repository = new Repository(this, APP, {
            imageScanOnPush: false,
            removalPolicy: RemovalPolicy.DESTROY,
            repositoryName:APP,
        });
    }
}