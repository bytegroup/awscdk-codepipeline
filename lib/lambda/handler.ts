export async function handler(event: string, context: string){
    console.log('Stage Name is ' + process.env.stage);
    return{
        body: 'Lambda fucntion executed - cicd codepipeline demo',
        statusCode: 200,
    }
}