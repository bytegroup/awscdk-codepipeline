import {SecretValue, Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {CodePipeline, CodePipelineSource, ShellStep} from "aws-cdk-lib/pipelines";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwscdkCodepipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'AwscdkCodepipelineQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    new CodePipeline(this, 'Pipeline', {
      pipelineName: 'CDKTestPipeline',       // Creating a new code pipeline which is a construct
      synth: new ShellStep('Synth', {        // Add a new synthesis 'shellstep' which will be pointed at our gihub repository
        input: CodePipelineSource.gitHub(
            'bytegroup/awscdk-codepipeline',
            'main',
            {
              authentication: SecretValue.secretsManager("github-token-pvt"),
            }
        ), // replace the GitHub repository name with 'user-name/repository-name'

        // The build steps for the pipeline are defined by these commands

        commands: ['npm ci',
          'npm run build',
          'npx cdk synth']
      }),
    })
  }
}
