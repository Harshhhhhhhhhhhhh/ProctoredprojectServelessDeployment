
// We need this to talk to DynamoDB indirectly.
// Business logic SHOULD NOT access DynamoDB directly.
import { TodosAccess } from '../dataLayer/todosAccess.mjs'


// For generating S3 pre-signed URLs and updating attachments.
import { AttachmentUtils } from '../fileStorage/attachmentUtils.mjs'

// Logger for debugging
import { createLogger } from '../utils/logger.mjs'
const logger = createLogger('TodosBusinessLogic')

// uuid for generating unique todo IDs
import { v4 as uuidv4 } from 'uuid'

// Create instances of helper classes
const todosAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

// =============================
// GET TODOS for user
// =============================
export async function getTodosForUser(userId) {
  logger.info("Business Logic: Fetching todos", { userId })

  return await todosAccess.getTodosForUser(userId)
}

// =============================
// CREATE a TODO
// =============================
export async function createTodo(newTodo, userId) {
  logger.info("Business Logic: Creating Todo", { newTodo, userId })

  const todoId = uuidv4()
  const createdAt = new Date().toISOString()

  const todoItem = {
    userId,
    todoId,
    createdAt,
    name: newTodo.name,
    dueDate: newTodo.dueDate,
    done: false,
    attachmentUrl: null
  }

  return await todosAccess.createTodo(todoItem)
}

// =============================
// UPDATE a TODO
// =============================
export async function updateTodo(userId, todoId, updatedTodo) {
  logger.info("Business Logic: Updating Todo", { userId, todoId, updatedTodo })

  // Let dataLayer handle the update
  await todosAccess.updateTodo(userId, todoId, updatedTodo)
}

// =============================
// DELETE a TODO
// =============================
export async function deleteTodo(userId, todoId) {
  logger.info("Business Logic: Deleting Todo", { userId, todoId })

  await todosAccess.deleteTodo(userId, todoId)
}

// =============================
// CREATE Pre-Signed Upload URL
// =============================
export async function createAttachmentPresignedUrl(userId, todoId) {
  logger.info("Business Logic: Generating Upload URL", { userId, todoId })

  // 1) Generate S3 PUT pre-signed URL
  const uploadUrl = attachmentUtils.getUploadUrl(todoId)

  // 2) Save final public attachment URL inside DynamoDB
  const attachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
  await todosAccess.updateAttachmentUrl(userId, todoId, attachmentUrl)

  return uploadUrl
}
