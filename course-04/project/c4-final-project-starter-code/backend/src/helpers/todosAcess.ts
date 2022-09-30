import * as AWS from 'aws-sdk'
import {DocumentClient, GetItemOutput} from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { TodosResponse } from '../models/TodoItemsResponse'
import {UpdateTodoRequest} from '../requests/UpdateTodoRequest'


// TODO: Implement the dataLayer logic


export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todoIdIndex = process.env.TODOS_CREATED_AT_INDEX
  ) {}

  async checkTodoExists(userId: string, todoId: string) {
    const result = await this.getTodoItem(userId, todoId);
    return !!result.Item;
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise();

    return todoItem;
  }

  async getTodoItem(userId: string, todoId: string) : Promise<GetItemOutput> {
    return await this.docClient.get({
      TableName: this.todosTable,
      Key: {
        "userId": userId,
        "todoId": todoId
      }
    }).promise();
  }

  async getAllTodosByUserId(userId: string, params): Promise<TodosResponse> {
    console.log('Get all todos for user: ', userId);
    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todoIdIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: params.limit,
      ExclusiveStartKey: params.nextKey,
      ScanIndexForward: true // Retruns the todos from earliest to latest
    }).promise()

    const items = result.Items
    return {
      items: items as TodoItem[],
      nextKey: encodeNextKey(result.LastEvaluatedKey),
    };
  }

  async addTodoAttachmentUrl(userId: string, todoId: string, attachmentUrl: string) {
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        'todoId': todoId,
        'userId': userId
      },
      UpdateExpression: "set attachmentUrl = :attachmentUrl",
      ExpressionAttributeValues: {
        ":attachmentUrl": attachmentUrl
      }
    }).promise();
  }

  async updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest) : Promise<UpdateTodoRequest> {
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId: todoId,
        userId: userId
      },
      UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': updatedTodo.name,
        ':dueDate': updatedTodo.dueDate,
        ':done': updatedTodo.done,
      },
    }).promise();
    
    return updatedTodo;
  }

  async deleteTodo(userId: string, todoId: string) {
    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        "todoId": todoId,
        "userId": userId
      }
    }).promise();
  }
}


function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new AWS.DynamoDB.DocumentClient()
}

function encodeNextKey(lastEvaluatedKey) {
  if(!lastEvaluatedKey) {
    return null;
  }

  return encodeURIComponent(JSON.stringify(lastEvaluatedKey));
}