import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { TodoItem } from '../../models/TodoItem'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'


const logger = createLogger('getTodos')

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE


export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing event: ', event)
  const userId = getUserId(event)
  
  const result = await docClient.query({
    TableName: todosTable,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
        ':userId': userId
    }
  }).promise()
  
  const items = result.Items as TodoItem[]

  return {
    statusCode: 200,
    body: JSON.stringify({
      items
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)