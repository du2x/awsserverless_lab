import 'source-map-support/register'

import * as AWS from 'aws-sdk'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { TodoItem } from '../../models/TodoItem'

const logger = createLogger('updateTodo')

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE


export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing event [update todo expected]: ', event)
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  
  const resultGetTodo = await docClient.query({
    TableName: todosTable,
    KeyConditionExpression: 'userId = :userId AND todoId = :todoId',
    ExpressionAttributeValues: {
        ':userId': userId,
        ':todoId': todoId
    }
  }).promise()

  const item = resultGetTodo.Items as TodoItem[]

  if (item.length === 0){
    return {
        statusCode: 404,
        body: 'Todo not found'
      }
  }

  const items = await docClient.update({
      TableName: todosTable,
      Key: { 
          todoId: todoId, 
          userId: userId 
        },
      ExpressionAttributeNames: {"#N": "name"},
      UpdateExpression: "set #N = :name, dueDate = :dueDate, done = :done",
      ExpressionAttributeValues: {
          ":name": updatedTodo.name,
          ":dueDate": updatedTodo.dueDate,
          ":done": updatedTodo.done,
      },
      ReturnValues: "UPDATED_NEW"
  }).promise()  

  return {
    statusCode: 200,
    body: JSON.stringify(items)
  }
})

handler.use(
  cors({
    credentials: true
  })
)