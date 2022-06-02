import {BuildSpec} from "aws-cdk-lib/aws-codebuild";
import {DEPLOY_IMAGE_FILE} from "./Constants";

export class BuildCommands {
    public getBuildSpec(){
        return BuildSpec.fromObject({
            version: '0.2',
            env: {
                shell: 'bash'
            },
            phases: {
                pre_build: {
                    commands: [
                        'echo logging in to AWS ECR',
                        'aws --version',
                        'echo $AWS_STACK_REGION',
                        'echo $CONTAINER_NAME',
                        'aws ecr get-login-password --region ${AWS_STACK_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_STACK_REGION}.amazonaws.com',
                        'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
                        'echo $COMMIT_HASH',
                        'IMAGE_TAG=${COMMIT_HASH:=latest}',
                        'echo $IMAGE_TAG'
                    ],
                },
                build: {
                    commands: [
                        'echo Build started on `date`',
                        'echo Build Docker image',
                        'docker build -f ${CODEBUILD_SRC_DIR}/Dockerfile -t ${REPOSITORY_URI}:latest ./',
                        'echo Running "docker tag ${REPOSITORY_URI}:latest ${REPOSITORY_URI}:${IMAGE_TAG}"',
                        'docker tag ${REPOSITORY_URI}:latest ${REPOSITORY_URI}:${IMAGE_TAG}'
                    ],
                },
                post_build: {
                    commands: [
                        'echo Build completed on `date`',
                        'echo Push Docker image',
                        'docker push ${REPOSITORY_URI}:latest',
                        'docker push ${REPOSITORY_URI}:${IMAGE_TAG}',
                        'printf "[{\\"name\\": \\"$CONTAINER_NAME\\", \\"imageUri\\": \\"$REPOSITORY_URI:$IMAGE_TAG\\"}]" > '+DEPLOY_IMAGE_FILE
                    ]
                }
            },
            artifacts: {
                files: [DEPLOY_IMAGE_FILE]
            },
        });
    }
}