import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodoDAO } from '../dataAccess/todoDAO'

const todoDAO = new TodoDAO()

export async function getAllTodos(userId: string): Promise<TodoItem[]>{
    return todoDAO.getAll(userId)
}

export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest): Promise<TodoItem>{
  const resultGetTodo = await todoDAO.getByUserIdAndTodoId(userId, todoId);
  if(resultGetTodo.length === 0)
    throw new Error("Item not found"); // todo: specialize exception
  return await todoDAO.update(todoId, userId, updateTodoRequest)    
}

export async function removeTodo(userId: string, todoId: string){
    return await todoDAO.remove(userId, todoId)
}

export async function updateTodoUrl(imgUrl: string, userId: string, todoId: string): Promise<TodoItem>{   
    return await todoDAO.updateUrl(
        userId,
        todoId,
        imgUrl
    )
}
  
export async function createTodo(createTodoRequest: CreateTodoRequest, userId: string): Promise<TodoItem>{
    const todoId = uuid.v4()
    const createdAt = new Date().toISOString()    
    return await todoDAO.create({
        userId,
        todoId,
        createdAt,
        done: false,
        ...createTodoRequest
    })
}
