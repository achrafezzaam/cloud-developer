import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import {getUserId} from '../utils';
import {getAllTodosByUserId} from '../../helpers/todos';

const logger = createLogger('Get Todos');
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const currentUser = getUserId(event);

  let limit: number;
  let nextKey: number;

  try {
    limit = parseLimit(event);
    nextKey = parseNextKey(event);
  } catch (err) {
    logger.info('Failed to parse query parameters', err.message);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Invalid parameters'
      })
    }
  }

  const res = await getAllTodosByUserId(currentUser, {limit, nextKey});
  logger.info('User: ', currentUser, 'Todos: ', res.items, 'Next Key: ', res.nextKey);

  if (Array.isArray(res.items) && res.items.length > 0) {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        items: res.items,
        nextKey: res.nextKey
      })
    }
  }

  return {
    statusCode: 400,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: 'No Todos'
  }
}

function getQuery(event:APIGatewayProxyEvent, name:string) {
  const queryParams = event.queryStringParameters;
  if (!queryParams) {
    return undefined;
  }

  return queryParams[name];
}

function parseNextKey(event:APIGatewayProxyEvent) {
  const nextKey = getQuery(event, 'nextKey');
  if (!nextKey) {
    return undefined;
  }

  const decodedUri = decodeURIComponent(nextKey);
  return JSON.parse(decodedUri);
}

function parseLimit(event:APIGatewayProxyEvent) {
  const limitVal = getQuery(event, 'limit');
  if (!limitVal) {
    return undefined;
  }

  const limit = parseInt(limitVal, 20);
  if (limit <= 0) {
    throw new Error('Limit Must Be Positive');
  }

  return limit;
}