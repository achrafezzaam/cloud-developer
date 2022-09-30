import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils';
import {deleteTodo, checkTodoExists} from '../../helpers/todos';
const logger = createLogger('Todo deletion');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId;
  const currentUser = getUserId(event);
  logger.info(`Request to delete todo with Id ${todoId}`);

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
    await deleteTodo(currentUser, todoId);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: `Successfully deleted todo with Id: ${todoId}`
    }
  } catch (err) {
    logger.error(`Failed to delete todo with Id ${todoId}`, err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: `Failed to delete todo with Id: ${todoId}`
    }
  }
}