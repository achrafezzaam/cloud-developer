import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils';
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import {createTodo} from '../../helpers/todos';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const logger = createLogger('Todo Creation');
  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  const currentUser = getUserId(event);

  try {
    const item = await createTodo(newTodo, currentUser);
    logger.info('Todo Item Created Successfully', item);

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        item
      })
    }
  } catch (err) {
    logger.info('Todo Item Creation Failed', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Todo Creation Failed',
    }
  }
}