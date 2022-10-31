import { Video } from '../Video'
import fs from 'fs'
import { execFileSync } from 'child_process'

const videos = await Video.findAll()
for (const video of videos) {
  const imageFilePath = video.imageFilePath
  if (!fs.existsSync(imageFilePath)) {
    console.log('Missing image file:', imageFilePath)
    try {
      execFileSync(
        'wget',
        [
          '-O',
          imageFilePath,
          `https://img.youtube.com/vi/${video.data.youtube}/maxresdefault.jpg`,
        ],
        { stdio: 'inherit' },
      )
    } catch {
      console.log('Failed to download image file:', imageFilePath)
    } finally {
      // If the file exists but is empty, delete it
      if (
        fs.existsSync(imageFilePath) &&
        fs.statSync(imageFilePath).size === 0
      ) {
        fs.unlinkSync(imageFilePath)
      }
    }
  }
}
