import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import * as AWS from 'aws-sdk'
import { createLogger } from '../utils/logger'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

export class TodoDAO {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE){}

      
    async getAll(userId: string): Promise<TodoItem[]> {
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
          }).promise()          
          const items = result.Items
          return items as TodoItem[]        
    }
   
    async update(todoId: string, userId: string, updatedTodo: any): Promise<TodoItem> {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: { 
                todoId: todoId, 
                userId: userId },
            ExpressionAttributeNames: {"#N": "name"},
            UpdateExpression: "set #N = :name, dueDate = :dueDate, done = :done",
            ExpressionAttributeValues: {
                ":name": updatedTodo.name,
                ":dueDate": updatedTodo.dueDate,
                ":done": updatedTodo.done,
            },
            ReturnValues: "UPDATED_NEW"
        }).promise()
          
        return updatedTodo
        
    }

    async updateUrl(imgUrl: string, userId: string, todoId: string): Promise<string> {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: { 
                todoId: todoId, 
                userId: userId },
            ExpressionAttributeNames: {"#A": "attachmentUrl"},
            UpdateExpression: "set #A = :attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": imgUrl,
            },
            ReturnValues: "UPDATED_NEW"
        }).promise()
          
        return imgUrl;    
    }

    async getByUserIdAndTodoId(userId: string, todoId: string): Promise<TodoItem[]> {
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId AND todoId = :todoId',
            ExpressionAttributeValues: {
                ':userId': userId,
                ':todoId': todoId
            }
          }).promise()          
          return result.Items as TodoItem[]          
    }    

    async remove(userId: string, todoId: string) {
        const logger = createLogger('deteleTodo')        
        const params = {
            TableName: this.todosTable,
            Key: {
              todoId, 
              userId
            }
          }
        await this.docClient.delete(params, function(err, data) {
            if (err) {
                logger.error("Could not delete item", JSON.stringify(err))
                throw new Error('Could not delete item');
            }
            else {
                logger.info("DeleteItem succeeded", JSON.stringify(data))
            }
        }).promise()       
    }

    async create(todo: TodoItem): Promise<TodoItem> {
        const logger = createLogger('createTodo')
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo,
          }, function(err, data) {
            if (err) {
                logger.error("Unable to create item", JSON.stringify(err))
                throw new Error('Could not create item');
            }
            else {
                logger.info("PutItem succeeded", JSON.stringify(data))
            }
          }).promise()          
        return todo      
    }
    
}