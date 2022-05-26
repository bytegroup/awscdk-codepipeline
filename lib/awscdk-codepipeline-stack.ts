import {SecretValue, Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {CodePipeline, CodePipelineSource, ManualApprovalStep, ShellStep} from "aws-cdk-lib/pipelines";
import {CDKPipelineStage} from "./stage";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwscdkCodepipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "CicdPipelineDemo",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub(
            'bytegroup/awscdk-codepipeline',
            'master',
            {
            authentication: SecretValue.secretsManager('github-token-cicd-pipeline-demo'),
        }),

        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ]
      }),
    });

    const testStage = pipeline.addStage(new CDKPipelineStage(this, "staging-cicd", {
      env: { account:"361854753178", region: "ap-northeast-1"}            //replace this with your aws-account-id and aws-region
    }));

    testStage.addPost(new ManualApprovalStep('Manaul approval step'));

    const productionStage = pipeline.addStage(new CDKPipelineStage(this, "production-cicd", {
      env: { account:"361854753178", region: "ap-northeast-1"}            //replace this with your aws-account-id and aws-region
    }));
  }
}
