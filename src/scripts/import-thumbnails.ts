import { Video, getDefaultImageFilePath } from '../Video'
import fs from 'fs'
import { execFileSync } from 'child_process'
import { getState, setState } from '../StateStorage'
import crypto from 'crypto'

const videos = await Video.findAll()
for (const video of videos) {
  const imageFilePath = getDefaultImageFilePath(video)
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

  if (fs.existsSync(imageFilePath)) {
    const stateKey = `video_${video.data.youtube}`
    const state = (await getState(stateKey)) || {}
    state.thumbnail ??= {}
    if (!state.thumbnail.hash) {
      state.thumbnail.hash = crypto
        .createHash('sha256')
        .update(fs.readFileSync(imageFilePath))
        .digest('hex')
      await setState(stateKey, state)
      console.log('Updated hash for', video.data.youtube)
    }
  }
}
