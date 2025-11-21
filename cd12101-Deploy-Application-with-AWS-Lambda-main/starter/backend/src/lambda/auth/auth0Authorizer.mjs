import Axios from 'axios'
import jsonwebtoken from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
//       to verify JWT token signature.
const jwksUrl = 'https://dev-xefkydzjxcypqpel.us.auth0.com/api/v2/np'

export async function handler(event) {
  try {
    logger.info("Authorizing user", event.authorizationToken)

    const jwtToken = await verifyToken(event.authorizationToken)

    logger.info("User was authorized", jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error("User not authorized", { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  const token = getToken(authHeader)
  const jwt = jsonwebtoken.decode(token, { complete: true })

  // TODO: Implement token verification
  

  if (!jwt) throw new Error("Invalid JWT token")

  // 1) Download JWKS keys
  const jwksResponse = await Axios.get(jwksUrl)
  const keys = jwksResponse.data.keys

  const signingKey = keys.find(key => key.kid === jwt.header.kid)
  if (!signingKey) throw new Error("No matching signing key found")

  // 2) Convert x5c cert to PEM format
  const cert = buildCert(signingKey.x5c[0])

  // 3) Verify token signature
  const verifiedToken = jsonwebtoken.verify(token, cert, {
    algorithms: ['RS256']
  })

  return verifiedToken
}

function buildCert(cert) {
  return `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
