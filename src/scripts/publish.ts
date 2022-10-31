import yargs from 'yargs'
import { Video } from '../Video'
import fs from 'fs'
import Minio from 'minio'
import 'dotenv/config'

const argv = await yargs(process.argv.slice(2))
  .options({
    upload: {
      type: 'boolean',
      default: false,
      description: 'Upload the data file',
    },
  })
  .strict()
  .help()
  .parse()

const videos = await Video.findAll()
const dataFile = JSON.stringify({ videos }, null, 2)
fs.mkdirSync('.data', { recursive: true })
fs.writeFileSync('.data/videos.json', dataFile)
console.log('Wrote .data/videos.json')

if (argv.upload) {
  const minioClient = new Minio.Client({
    endPoint: 'storageapi.fleek.co',
    useSSL: true,
    accessKey: process.env.FLEEK_ACCESS_KEY_ID!,
    secretKey: process.env.FLEEK_SECRET_ACCESS_KEY!,
  })
  await minioClient.putObject(
    '270caae0-5f63-4b47-ab6a-0b31b59416f0-bucket',
    'creatorsgarten/videos/videos.json',
    dataFile,
  )
  console.log('Uploaded to Fleek')
}
