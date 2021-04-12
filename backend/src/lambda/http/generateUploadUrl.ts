import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getUserId } from '../utils'
import * as AWSXRay from 'aws-xray-sdk'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION


export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  const docClient = new XAWS.DynamoDB.DocumentClient()
  const todosTable = process.env.TODOS_TABLE

  // Update dynamoDb with Url
  const uploadUrl = getUploadUrl(todoId)
  const userId = getUserId(event)
  const updatedTodo = {
    attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
  }

  await docClient.update({
            TableName: todosTable,
            Key: { 
                todoId: todoId, 
                userId: userId },
            ExpressionAttributeNames: {"#A": "attachmentUrl"},
            UpdateExpression: "set #A = :attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": updatedTodo.attachmentUrl,
            },
            ReturnValues: "UPDATED_NEW"
        }).promise()
  
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl
    })
  }
})

function getUploadUrl(todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })
}

handler.use(
  cors({
    credentials: true
  })
)