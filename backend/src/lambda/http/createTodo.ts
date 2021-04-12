import * as AWS from 'aws-sdk'
import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getUserId } from '../utils'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import * as uuid from 'uuid'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('createTodo')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  const docClient = new XAWS.DynamoDB.DocumentClient()
  const todosTable = process.env.TODOS_TABLE

  logger.info('Processing event (new todo expected): ', event)
  const userId = getUserId(event)
  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  const createdAt = new Date().toISOString()
  const itemId = uuid.v4()
  const newTodoItem = {
    todoId: itemId,
    userId:userId,
    createdAt: createdAt,
    ...newTodo
  } 

  docClient.put({
    TableName: todosTable,
    Item: newTodoItem,
  }).promise()


  return {
    statusCode: 201,
    body: JSON.stringify({
      item: newTodoItem
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)