import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import {getUserId} from '../utils';
import { createLogger } from '../../utils/logger'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import {updateTodo, checkTodoExists} from '../../helpers/todos';

const logger = createLogger('Update Todo');
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId;
  const currentUser = getUserId(event);
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body);

  const todoExist = await checkTodoExists(currentUser, todoId);
  if (!todoExist) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: `Can't find Todo with Id: ${todoId}`
    }
  }

  try {
    await updateTodo(currentUser, todoId, updatedTodo);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Todo Item Updated Succesfully'
    }
  } catch (err) {
    logger.error('Todo Item Update Failed', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: `Todo Item Update Failed`, 
    }
  }

}