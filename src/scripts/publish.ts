import yargs from 'yargs'
import { Video } from '../Video'
import fs from 'fs'
import 'dotenv/config'
import { execSync } from 'child_process'

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
fs.mkdirSync('.data/gh-pages', { recursive: true })
fs.writeFileSync('.data/gh-pages/videos.json', dataFile)
console.log('Wrote .data/videos.json')

if (argv.upload) {
  execSync(
    [
      'set -e',
      'cd .data/gh-pages',
      'git add -A',
      'git config user.name "creatorsgarten[bot]"',
      'git config user.email "creatorsgarten[bot]@users.noreply.github.com"',
      'git commit -m "Update videos catalog file" || true',
      'git push',
    ].join('\n'),
    { stdio: 'inherit' },
  )
}
