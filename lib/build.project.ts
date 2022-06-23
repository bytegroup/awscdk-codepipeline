import {LinuxBuildImage, Project, ProjectProps, Source} from "aws-cdk-lib/aws-codebuild";
import {Construct} from "constructs";
import {Effect, ManagedPolicy, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {githubConfig} from "../constants/Constants";

interface Props extends ProjectProps{

}

export class BuildProject extends Project{
    constructor(scope: Construct, id: string, props: Props) {
        super(scope, id, {
            ...props,
            source: Source.gitHub({
                owner: githubConfig.owner,
                repo: githubConfig.repo,
                webhook: false,
                /*webhookFilters: [
                    FilterGroup.inEventOf(EventAction.PUSH).andBranchIs(githubConfig.branch),
                ],*/
            }),
            environment: {
                buildImage: LinuxBuildImage.STANDARD_5_0,
                privileged: true,
            },
        });

        this.addToRolePolicy(
            new PolicyStatement({
                actions: ["secretsmanager:GetSecretValue"],
                resources: [githubConfig.secreteManagerTokenArn],
            })
        );
        this.role?.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
        );
        this.addToRolePolicy(new PolicyStatement({
            actions: ["cloudfront:CreateInvalidation"],
            effect: Effect.ALLOW,
            resources:["*"]
        }));
    }
}