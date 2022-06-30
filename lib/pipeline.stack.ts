import {Environment, SecretValue, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {APP, AWS_ENV_PROD, githubConfig, PROD_ENV_FILE, RESOURCE_BUCKET, STG_ENV_FILE} from "../constants/Constants";
import {
    Action,
    CodeBuildAction,
    GitHubSourceAction,
    GitHubTrigger,
    ManualApprovalAction,
    S3DeployAction, S3SourceAction
} from "aws-cdk-lib/aws-codepipeline-actions";
import {Source} from "aws-cdk-lib/aws-codebuild";
import {Artifact, Pipeline} from "aws-cdk-lib/aws-codepipeline";
import {BuildCommands} from "../constants/build.commands";
import {Distribution, IDistribution} from "aws-cdk-lib/aws-cloudfront";
import {BuildProject} from "./build.project";
import {Bucket, IBucket} from "aws-cdk-lib/aws-s3";
import {AppDeployStage} from "./app.deploy.stage";

interface Props extends StackProps {
    webStageEnv: {
        prod: {
            env: Environment;
            distribution?: Distribution;
            buildBucket?: Bucket;
        }
        stg: {
            env: Environment;
            distribution: Distribution;
            buildBucket: Bucket;
        },
    }

}

const artifacts = {
    source: new Artifact("Source"),
    build_stg: new Artifact("OutStg"),
    build_prod: new Artifact("OutProd"),
}

export class PipelineStack extends Stack{
/*    private readonly hostBucketStg:IBucket;
    private readonly hostBucketProd:IBucket;
    private readonly distributionStg:IDistribution;
    private readonly distributionProd:IDistribution;*/

    constructor(scope:Construct, id:string, private readonly props: Props) {
        super(scope, id, props);
        if (!props) {
            throw new Error('props required');
        }


        /*this.hostBucketStg = Bucket.fromBucketArn(this, APP+'host-stg-bucket', props.webSpecs.stg.buildBucketArn);
        //this.hostBucketProd = Bucket.fromBucketArn(this, APP+'host-prod-bucket', props.webSpecs.prod.buildBucketArn);
        this.hostBucketProd = Bucket.fromBucketArn(this, APP+'host-prod-bucket', prodBktArn);
        this.distributionStg = Distribution.fromDistributionAttributes(this, APP+'-stg-distr', {
            distributionId: props.webSpecs.stg.distribution.id,
            domainName: props.webSpecs.stg.distribution.domainName,
        });
        this.distributionProd = Distribution.fromDistributionAttributes(this, APP+'-prod-distr', {
            //distributionId: props.webSpecs.prod.distribution.id,
            distributionId: prodDistId,
            domainName: props.webSpecs.prod.distribution.domainName,
        });*/
        /*new GitHubSourceCredentials(this, APP+"-github-creds", {
            accessToken: SecretValue.secretsManager(githubConfig.secreteManagerTokenName),
        });*/

        const stack = Stack.of(this);
        const buildCommands = new BuildCommands();
        const buildSpec = buildCommands.getBuildSpec();
        const project_stg = new BuildProject(this, APP+"-stg-project", {
            projectName: APP+"-stg-project",
            buildSpec,
            environmentVariables: {
                RESOURCE_BUCKET: {
                    value: RESOURCE_BUCKET,
                },
                APP_ENV_FILE_NAME: {
                    value: STG_ENV_FILE,
                },
                HOST_BUCKET: {
                    value: props.webStageEnv.stg.buildBucket.bucketName,
                },
                DISTRIBUTION_ID: {
                    value: props.webStageEnv.stg.distribution.distributionId,
                },
            },
        });
        /*const project_prod = new BuildProject(this, APP+"-prod-project", {
            projectName: APP+"-prod-project",
            buildSpec,
            environmentVariables: {
                RESOURCE_BUCKET: {
                    value: RESOURCE_BUCKET,
                },
                APP_ENV_FILE_NAME: {
                    value: PROD_ENV_FILE,
                },
                HOST_BUCKET: {
                    value: this.hostBucketProd.bucketName,
                },
                DISTRIBUTION_ID: {
                    value: this.distributionProd.distributionId,
                },
            },
        });*/

        const pipelineActions = {
            source: new GitHubSourceAction({
                actionName: "Github",
                owner: githubConfig.owner,
                repo: githubConfig.repo,
                branch: githubConfig.branch,
                oauthToken: SecretValue.secretsManager(githubConfig.secreteManagerTokenName),
                output: artifacts.source,
                trigger: GitHubTrigger.WEBHOOK,
            }),

            build: new CodeBuildAction({
                actionName: APP+"-build",
                project: project_stg,
                input: artifacts.source,
                outputs: [artifacts.build_stg],
            }),
            deploy: new S3DeployAction({
                actionName: APP+'-staging-deploy',
                bucket: props.webStageEnv.stg.buildBucket,
                input: artifacts.build_stg,
                //extract: false,
                //cacheControl:[CacheControl.noCache()]
            }),
            approve: new ManualApprovalAction({
                actionName: "DeployToProduction",
                runOrder: 1,
            }),
            /*prod_build: new CodeBuildAction({
                actionName: APP+"-prod-build",
                project: project_prod,
                input: artifacts.source,
                outputs:[artifacts.build_prod],
                runOrder: 2,
            }),
            prod_deploy: new S3DeployAction({
                actionName: APP+'-prod-deploy-action',
                input: artifacts.build_prod,
                bucket: this.hostBucketProd,
                runOrder: 3,
            }),*/
        }
        const pipeline = new Pipeline(this, APP+"-pipeline", {
            crossAccountKeys: true,
            pipelineName: APP+"-pipeline",
            stages: [
                { stageName: "Source", actions: [pipelineActions.source] },
                { stageName: "Build", actions: [pipelineActions.build] },
                { stageName: "Deploy-Staging", actions: [pipelineActions.deploy] },
                {
                    stageName: "Deploy-Production", actions: [
                        pipelineActions.approve,
                        //pipelineActions.prod_build,
                        //pipelineActions.prod_deploy,
                    ]
                },
            ],
        });

        pipeline.addStage({
            stageName: "test",
            actions:[],
        })

        const _this = this;



        pipeline.addStage(new AppDeployStage(_this, APP+'-prod-deployment', {
            artifacts: artifacts,
            buildSpec: buildSpec,
            env: props.webStageEnv.prod.env,
        }));
    }
}