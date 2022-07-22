import {Environment} from "aws-cdk-lib";

export const AWS_ENV: Environment = {
    account: '361854753178',
    region: 'ap-northeast-1'
}

export const githubConfig = {
    owner: 'toggle-inc',
    repo: 'mine_map_app_server',
    branch: 'pre-staging',
    //secreteManagerTokenName:'github-token-cicd-npipeline-demo',
    secreteManagerTokenName:'github-secret-token',
    secreteManagerTokenArn:'arn:aws:secretsmanager:ap-northeast-1:361854753178:secret:github-secret-token-ABvX7J',
}

export const APP = 'mineMap-server-preStg';
export const REPOSITORY_NAME = 'mine-map-server-pre-stg';

export const TAGS = {
    'Author': "Mizanur",
}

export const CONTAINER_PORT = 3000;
export const VPC_NAME = "toggle-staging-vpc";
export const VPC_ID = "vpc-00f205a96f9862cb2";/*toggle-staging-vpc*/
export const DEPLOY_IMAGE_FILE="docker_image_definition.json";
export const RESOURCE_BUCKET = "codepipeline-resources-cdk";
export const ENV_VARIABLE_FILE = "mine-map-server-env-variable-pre-stg.env";