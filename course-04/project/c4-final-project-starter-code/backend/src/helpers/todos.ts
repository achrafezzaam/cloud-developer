import { TodosAccess } from './todosAcess'
// import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodosResponse } from '../models/TodoItemsResponse'
import * as uuid from 'uuid'

// TODO: Implement businessLogic

const todosAccess = new TodosAccess();

export async function checkTodoExists(currentUserId: string, todoId: string) {
  return todosAccess.checkTodoExists(currentUserId, todoId);
}

export async function createTodo(todoItem: CreateTodoRequest, userId) : Promise<TodoItem> {
  const newTodoId = uuid.v4(); 
  const newTodoItem : TodoItem = {
    ...todoItem,
    todoId: newTodoId,
    userId,
    createdAt: new Date().toISOString(),
    done: false
  }
return todosAccess.createTodo(newTodoItem);
}

export async function getTodoItem(currentUserId: string, todoId: string) {
  return todosAccess.getTodoItem(currentUserId, todoId);
}

export async function getAllTodosByUserId(userId: string, params) : Promise<TodosResponse> {
  return todosAccess.getAllTodosByUserId(userId, params);
}

export async function addTodoAttachmentUrl(userId: string, todoId: string) {
  const bucketName = process.env.ATTACHMENT_S3_BUCKET;
  const attachmentUrl =  `https://${bucketName}.s3.amazonaws.com/${todoId}`;
  return todosAccess.addTodoAttachmentUrl(userId, todoId, attachmentUrl);
}

export async function updateTodo(userId: string, todoId: string, updateTodo: UpdateTodoRequest) : Promise<UpdateTodoRequest> {
  return todosAccess.updateTodo(userId, todoId, updateTodo);
}

export async function deleteTodo(userId: string, todoId: string) {
  return todosAccess.deleteTodo(userId, todoId);
}