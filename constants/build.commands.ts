import {BuildSpec} from "aws-cdk-lib/aws-codebuild";
import {APP, DEPLOY_IMAGE_FILE, HOST_BUCKET} from "./Constants";

export class BuildCommands {
    public getBuildSpec() {
        return BuildSpec.fromObjectToYaml({
            version: '0.2',
            /*env: {
                shell: 'bash'
            },*/
            phases: {
                install: {
                    "runtime-versions": {
                        "nodejs": 14,
                    },
                    commands: [
                        "echo not installing anything else",
                    ],
                },
                pre_build: {
                    commands: [
                        'echo copy env file to project',
                        'aws s3 cp s3://${RESOURCE_BUCKET}/commonEnv_client_prod.env .env',
                        'echo Installing source dependencies...',
                        'yarn install',
                        'aws --version',
                    ],
                },
                build: {
                    commands: [
                        'echo Build started on `date`',
                        'echo Compiling the mine map app client code',
                        'yarn lint',
                        'yarn build',
                    ],
                },
                post_build: {
                    commands: [
                        'echo Build completed on `date`',
                        'echo removing .env file',
                        'rm -fr .env',
                        'echo invalidating old code in cloudfront distribution',
                        'aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths "/*"',
                        'echo removing all from bucket',
                        'aws s3 rm s3://${HOST_BUCKET} --recursive',
                        //'echo Push build package to bucket',
                        //'aws s3 sync ${CODEBUILD_SRC_DIR}/out s3://${HOST_BUCKET}/',
                    ]
                }
            },
            artifacts: {
                files: ['**/*'],
                //name: 'mine-map-client-stg-$(date +%Y-%m-%d)',
                "base-directory": "out",
            },

        });
    }
}