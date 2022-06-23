#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {
    APP,
    AWS_ENV_PROD,
    AWS_ENV_STG,
    githubConfig,
    PROD_WEB_CONFIG,
    STAGING_WEB_CONFIG
} from "../constants/Constants";
import {PipelineStack} from "../lib/pipeline.stack";
import {Tags} from "aws-cdk-lib";
import {S3DeployStack} from "../lib/s3.deploy.stack";
import {SsmAction} from "aws-cdk-lib/aws-cloudwatch-actions";

const app = new cdk.App();

const webConfigStackStg = new S3DeployStack(app, APP+'-web-stack-stg', {
    env: AWS_ENV_STG,
    stackName: APP+'-web-stack',
    webConfig: STAGING_WEB_CONFIG,
});
const webConfigStackProd = new S3DeployStack(app, APP+'-web-stack-prd', {
    env: AWS_ENV_PROD,
    stackName: APP+'-web-stack',
    webConfig: PROD_WEB_CONFIG,
});
const prodDistId = webConfigStackProd.distribution.distributionId;
const prodBuildBkt = webConfigStackProd.buildBucket.bucketArn;
webConfigStackStg.addDependency(webConfigStackProd);
//webConfigStackStg.exportValue(webConfigStackProd.distribution.distributionId, {name:APP+'-web-dist-'+PROD_WEB_CONFIG.appEnv});
//webConfigStackStg.exportValue(webConfigStackProd.buildBucket.bucketArn, {name:APP+'-web-bkt-'+PROD_WEB_CONFIG.appEnv});

const prodDistTest = cdk.Fn.importValue(APP+'-web-dist-'+PROD_WEB_CONFIG.appEnv);
const prodBktTest = cdk.Fn.importValue(APP+'-web-bkt-'+PROD_WEB_CONFIG.appEnv);

const pipeline = new PipelineStack(app, APP+'-pipeline-stack', webConfigStackProd.buildBucketArn, webConfigStackProd.distributionId, {
    env: AWS_ENV_STG,
    webSpecs: {
        prod: {
            env: PROD_WEB_CONFIG,
        },
        stg: {

        }
    },
});
pipeline.addDependency(webConfigStackProd);
pipeline.addDependency(webConfigStackStg);
Tags.of(app).add("owner", githubConfig.owner);
app.synth();
/*start().catch(error => {
    console.log(error)
    process.exit(1)
})*/
/*
new AwscdkCodepipelineStack(app, 'AwscdkCodepipelineStack', {
  /!* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. *!/

  /!* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. *!/
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /!* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. *!/
  // env: { account: '123456789012', region: 'us-east-1' },

  /!* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html *!/
});*/
