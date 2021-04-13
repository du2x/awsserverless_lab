import * as AWS from 'aws-sdk'
import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getUserId } from '../utils'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../business/todo'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'


const logger = createLogger('createTodo')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  logger.info('Processing event (CreateTodo expected): ', event)
  const userId = getUserId(event)
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  
  try{
    const retData = await createTodo(newTodo, userId);    
    return {
      statusCode: 201,
      body: JSON.stringify({
        item: retData
      })
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