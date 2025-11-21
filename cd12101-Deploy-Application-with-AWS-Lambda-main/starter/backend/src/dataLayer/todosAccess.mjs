
// To access DynamoDB
import AWS from 'aws-sdk'


// To trace DynamoDB calls
import AWSXRay from 'aws-xray-sdk'

// Wrap AWS with X-Ray
const XAWS = AWSXRay.captureAWS(AWS)

// Logger for debugging
import { createLogger } from '../utils/logger.mjs'
const logger = createLogger('TodosAccess')

export class TodosAccess {

  constructor() {
    // DocumentClient makes DynamoDB JSON-friendly
    this.docClient = new XAWS.DynamoDB.DocumentClient()

    // Read table name from serverless.yml environment
    this.todosTable = process.env.TODOS_TABLE

    // Read index name for GetTodos
    this.createdAtIndex = process.env.TODOS_CREATED_AT_INDEX
  }

  // =============================
  // GET todos for a user
  // =============================
  async getTodosForUser(userId) {
    logger.info("Fetching todos for user", { userId })

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.createdAtIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

    return result.Items
  }

  // =============================
  // CREATE new todo
  // =============================
  async createTodo(todoItem) {
    logger.info("Creating new todo", { todoItem })

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()

    return todoItem
  }

  // =============================
  // UPDATE existing todo
  // =============================
  async updateTodo(userId, todoId, todoUpdate) {
    logger.info("Updating todo", { userId, todoId })

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression:
        "set #name = :name, dueDate = :dueDate, done = :done",
      ExpressionAttributeNames: {
        "#name": "name"
      },
      ExpressionAttributeValues: {
        ":name": todoUpdate.name,
        ":dueDate": todoUpdate.dueDate,
        ":done": todoUpdate.done
      }
    }).promise()
  }

  // =============================
  // DELETE todo
  // =============================
  async deleteTodo(userId, todoId) {
    logger.info("Deleting todo", { userId, todoId })

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      }
    }).promise()
  }

  // =============================
  // UPDATE attachmentUrl after upload
  // =============================
  async updateAttachmentUrl(userId, todoId, attachmentUrl) {
    logger.info("Saving attachment URL", { todoId })

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: "set attachmentUrl = :attachmentUrl",
      ExpressionAttributeValues: {
        ":attachmentUrl": attachmentUrl
      }
    }).promise()
  }
}
