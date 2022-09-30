import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS  from 'aws-sdk'

import {getUserId} from '../utils';
import {createLogger} from '../../utils/logger'
import {checkTodoExists, addTodoAttachmentUrl} from '../../helpers/todos';

const bucketName = process.env.ATTACHMENT_S3_BUCKET;
const urlExpiration = process.env.SIGNED_URL_EXPIRATION;

const logger = createLogger('Generate Upload Url');
const s3 = new AWS.S3({
  signatureVersion: 'v4'
});
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId;
  const currentUser = getUserId(event);

  const todoExist = await checkTodoExists(currentUser, todoId);
  if (!todoExist){
    logger.info(`Cannot find todo with todoId: ${todoId}`);
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: `Can't find Todo with Id: ${todoId}`
    }
  }
 
  const uploadUrl = await getUploadUrl(todoId);
  await addTodoAttachmentUrl(currentUser, todoId);

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      uploadUrl,
    })
  }
}

function getUploadUrl(todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })
}