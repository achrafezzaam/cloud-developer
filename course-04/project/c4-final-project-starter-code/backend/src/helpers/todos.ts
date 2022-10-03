import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import { TodoUpdate } from '../models/TodoUpdate'
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client'
import Key = DocumentClient.Key

// TODO: Implement businessLogic

const todosAccess = new TodosAccess()

const attachmentUtils = new AttachmentUtils()

const logger = createLogger('Todos Business Logic')

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  logger.info('Creating a new todo')
  const todoId = uuid.v4()

  const newItem = {
    ...createTodoRequest,
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false
  }

  return await todosAccess.createTodo(newItem)
}

export async function getAllUserTodos(userId: string,limit: number,key:Key|null|undefined): Promise<{ items:TodoItem[],lastKey:Key|null|undefined }> {
  logger.info('Getting All User\'s Todos')
  return todosAccess.getAllUserTodos(userId,limit,key)
}

export async function updateTodo(
  todoId: string,
  userId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<TodoUpdate> {
  logger.info('Updating Todo')
  return await todosAccess.updateTodo(todoId, userId, updateTodoRequest)
}

export async function generateUploadUrl(
  todoId: string,
  userId: string
): Promise<string> {
  logger.info('Generating UploadUrl')
  const attachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
  await todosAccess.updateTodoAttachmentUrl(todoId, userId, attachmentUrl)
  return attachmentUtils.getUploadUrl(todoId)
}

export async function deleteTodo(
  todoId: string,
  userId: string
): Promise<void> {
  logger.info('Deleting Todo')
  return await todosAccess.deleteTodo(todoId, userId)
}

export async function deleteAttachment(
  todoId: string
): Promise<void> {
  logger.info('Deleting Attachment From The s3 Bucket')
  return await attachmentUtils.deleteAttachment(todoId)
}