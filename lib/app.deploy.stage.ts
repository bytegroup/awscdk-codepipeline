import {Fn, Stack, StackProps, Stage, StageProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Distribution} from "aws-cdk-lib/aws-cloudfront";
import {APP, PROD_ENV_FILE, PROD_WEB_CONFIG, RESOURCE_BUCKET} from "../constants/Constants";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Artifact} from "aws-cdk-lib/aws-codepipeline";
import {CodeBuildAction, ManualApprovalAction, S3DeployAction} from "aws-cdk-lib/aws-codepipeline-actions";
import {BuildProject} from "./build.project";
import {BuildSpec} from "aws-cdk-lib/aws-codebuild";

interface Props extends StageProps{
    artifacts: {
        source: Artifact;
        build_stg: Artifact;
        build_prod: Artifact;
    },
    buildSpec: BuildSpec,
}

interface DeployStackProps extends StackProps{
    stageProps: Props
}

class AppDeployStack extends Stack{
    constructor(scope:Construct, id:string, props:DeployStackProps) {
        super(scope, id, props);


    }
}


export class AppDeployStage extends Stage{
    constructor(scope:Construct, id:string, props:Props) {
        super(scope, id, props);
        new ManualApprovalAction({
            actionName: "DeployToProduction",
            runOrder: 1,
        });
        const distributionId = Fn.importValue(APP+'-web-dist-'+PROD_WEB_CONFIG.appEnv);
        const buildBucketArn = Fn.importValue(APP+'-web-bkt-'+PROD_WEB_CONFIG.appEnv);

        /*const distribution = Distribution.fromDistributionAttributes(this, APP+'-prod-dist', {
            domainName: '',
            distributionId: distributionId,
        });*/

        const buildBucket = Bucket.fromBucketArn(scope, APP+'-host-bkt-'+PROD_WEB_CONFIG.appEnv, buildBucketArn);

        const project_prod = new BuildProject(scope, APP+"-prod-project", {
            projectName: APP+"-prod-project",
            buildSpec: props.buildSpec,
            environmentVariables: {
                RESOURCE_BUCKET: {
                    value: RESOURCE_BUCKET,
                },
                APP_ENV_FILE_NAME: {
                    value: PROD_ENV_FILE,
                },
                HOST_BUCKET: {
                    value: buildBucket.bucketName,
                },
                DISTRIBUTION_ID: {
                    value: distributionId,
                },
            },
        });

        new CodeBuildAction({
            actionName: APP+"-prod-build",
            project: project_prod,
            input: props.artifacts.source,
            outputs:[props.artifacts.build_prod],
            runOrder: 2,
        })

        new S3DeployAction({
            actionName: APP+'-prod-deploy-action',
            input: props.artifacts.build_prod,
            bucket: buildBucket,
            runOrder: 3,
        });

        /*this.bucketDeployment = new BucketDeployment(this,APP+'-bucket',{
            sources: [Source.asset('../out')],
            destinationBucket: buildBucket,
            distribution: distribution,
        });*/

       /* new AppDeployStack(this, APP+'-deploy-stack', {
            stageProps: props,
            ...props
        })*/
    }
}