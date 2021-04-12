import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('deleteTodo')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const docClient = new XAWS.DynamoDB.DocumentClient()
  const todosTable = process.env.TODOS_TABLE

  logger.info('Processing event (delete todo expected): ', event)
  try{
    removeTodo(todoId, event)
    return {
      statusCode: 200,
      body: ''
    }
  }
  catch(err){
    return {
      statusCode: 500,
      body: err
    }
  }

  async function removeTodo(todoId: string, event: any){
    const userId = getUserId(event)
    const params = {
      TableName: todosTable,
      Key: {
        todoId, 
        userId
      }
    }

    return await docClient.delete(params, function(err, data) {
      if (err) {
        logger.error("Unable to delete item", JSON.stringify(err))
        throw new Error('could not delete item');
      }
      else {
        logger.log("DeleteItem succeeded", JSON.stringify(data))
      }
    }
    ).promise()        
  }  
}) 

handler.use(
  cors({
    credentials: true
  })
)
