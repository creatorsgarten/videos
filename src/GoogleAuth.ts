import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'

const client = fs.existsSync('.data/google_client_secret.json')
  ? JSON.parse(fs.readFileSync('.data/google_client_secret.json', 'utf8'))
  : {
      web: {
        client_id: 'dummy',
        client_secret: 'dummy',
        redirect_uris: ['dummy'],
      },
    }

const scopes = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
]

export const authClient = new google.auth.OAuth2(
  client.web.client_id,
  client.web.client_secret,
  client.web.redirect_uris[0],
)

export async function getAuthUrl() {
  const authUrl = authClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  })
  return authUrl
}

export async function login(code: string) {
  const response = await authClient.getToken(code)
  const tokenFilePath = '.data/google_auth.json'

  fs.mkdirSync(path.dirname(tokenFilePath), { recursive: true })
  fs.writeFileSync(tokenFilePath, JSON.stringify(response.tokens, null, 2))
  console.log('Token stored to', tokenFilePath)
}

export async function getToken() {
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    console.log(
      'Skipping filesystem token storage because GOOGLE_REFRESH_TOKEN is set',
    )
    const token = {
      access_token: '',
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      scope: scopes.join(' '),
      token_type: 'Bearer',
      expiry_date: 0,
    }
    authClient.setCredentials(token)
    const response = await authClient.refreshAccessToken()
    return response.credentials.access_token
  }

  const token = JSON.parse(fs.readFileSync('.data/google_auth.json', 'utf8'))
  authClient.setCredentials(token)

  // Renew the token if it's expired
  if (token.expiry_date < Date.now() + 300e3) {
    console.log('Token expired, renewing...')
    const response = await authClient.refreshAccessToken()
    const newToken = {
      ...token,
      access_token: response.credentials.access_token,
      expiry_date: response.credentials.expiry_date,
    }
    fs.writeFileSync(
      '.data/google_auth.json',
      JSON.stringify(newToken, null, 2),
    )
    authClient.setCredentials(newToken)
  } else {
    console.log(
      'Token is still valid for ' +
        Math.floor((token.expiry_date - Date.now()) / 60e3) +
        ' minutes',
    )
  }
  return token.access_token
}
