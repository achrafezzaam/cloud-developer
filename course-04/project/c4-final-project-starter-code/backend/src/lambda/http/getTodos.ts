import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getUserId } from '../utils';
import { getAllUserTodos } from '../../helpers/todos'

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here

    const nextKey = parseNextKey(event)
    const limit = parseLimit(event) || 10

    const { items,lastKey } = await getAllUserTodos(getUserId(event), limit, nextKey)
    const nextKeyEncoded = encodeNextKey(lastKey)

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: items,
        nextKey: nextKeyEncoded
      })
    }
  })

handler.use(
  cors({
    credentials: true
  })
)

function parseLimit(event) {
  const limitStr = getQuery(event, 'limit')
  if (!limitStr) {
    return undefined
  }

  const limit = parseInt(limitStr, 10)
  if (limit <= 0) {
    throw new Error('Limit Should Be Positive')
  }

  return limit
}

function parseNextKey(event) {
  const nextKeyStr = getQuery(event, 'nextKey')
  if (!nextKeyStr) {
    return undefined
  }

  const uriDecoded = decodeURIComponent(nextKeyStr)
  return JSON.parse(uriDecoded)
}

function getQuery(event, name) {
  const queryParams = event.queryStringParameters
  if (!queryParams) {
    return undefined
  }

  return queryParams[name]
}

function encodeNextKey(lastEvaluatedKey) {
  if (!lastEvaluatedKey) {
    return null
  }

  return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
}