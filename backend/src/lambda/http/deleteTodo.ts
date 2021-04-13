import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { removeTodo } from '../../business/todo'


const logger = createLogger('deleteTodo')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)

  logger.info('Processing event (DeleteTodo expected): ', event)
  
  try{
    removeTodo(todoId, userId)
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

}) 

handler.use(
  cors({
    credentials: true
  })
)
