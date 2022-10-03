import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import Key = DocumentClient.Key

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosIndex = process.env.INDEX_NAME) {
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('Creating a new todo')

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()

    return todoItem
  }

  async getAllUserTodos(userId: string,limit:number,key:Key|null|undefined): Promise<{ items:TodoItem[],lastKey:Key|null|undefined }> {
    logger.info('Getting Paginated todos')

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosIndex,
      KeyConditionExpression: 'userId = :userId',
      Limit: limit,
      ExclusiveStartKey: key,
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

    const items = result.Items
    const lastKey = result.LastEvaluatedKey
    return { items:items as TodoItem[], lastKey }
  }

  async updateTodo(todoId: string, userId: string, todoUpdate: TodoUpdate): Promise<TodoUpdate> {
    logger.info('Updating a todo')

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId,
        userId
      },
      UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeValues: {
        ':name': todoUpdate.name,
        ':dueDate': todoUpdate.dueDate,
        ':done': todoUpdate.done
      },
      ExpressionAttributeNames: {
        '#name': 'name'
      }
    }).promise()

    return todoUpdate
  }

  async deleteTodo(todoId: string, userId: string): Promise<void> {
    logger.info('Deleting a todo')

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        todoId,
        userId
      }
    }).promise()
  }

  async updateTodoAttachmentUrl(todoId: string, userId: string, attachmentUrl: string): Promise<void> {
    logger.info('Updating a todo attachment url')

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId,
        userId
      },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      }
    }).promise()
  }
}

function createDynamoDBClient() {
  // @ts-ignore
  return new XAWS.DynamoDB.DocumentClient()
}