// WHY import AWS?
// For interacting with S3 (generating pre-signed URLs)
import AWS from 'aws-sdk'

// WHY X-Ray?
// So all S3 calls get traced in AWS X-Ray → required for rubric
import AWSXRay from 'aws-xray-sdk'

// Wrap S3 client inside X-Ray
const XAWS = AWSXRay.captureAWS(AWS)

// Logger for debugging
import { createLogger } from '../utils/logger.mjs'
const logger = createLogger('AttachmentUtils')

export class AttachmentUtils {

  constructor() {
    // S3 client for creating signed URLs
    this.s3 = new XAWS.S3({
      signatureVersion: 'v4'
    })

    // Bucket name from serverless.yml
    this.bucketName = process.env.ATTACHMENTS_S3_BUCKET

    // Signed URL expiration time
    this.urlExpiration = process.env.SIGNED_URL_EXPIRATION
  }

  // =============================
  // Generate pre-signed upload URL
  // =============================
  getUploadUrl(todoId) {
    logger.info("Generating signed URL", { todoId })

    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: this.urlExpiration
    })
  }

  // =============================
  // Return public URL of uploaded image
  // =============================
  getAttachmentUrl(todoId) {
    // This will be saved into DynamoDB
    return `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
  }
}
