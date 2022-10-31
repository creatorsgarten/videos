import { Video } from '../Video'
import fs from 'fs'
import Jimp from 'jimp'

const videos = await Video.findAll()
for (const video of videos) {
  const imageFilePath = video.imageFilePath
  if (fs.existsSync(imageFilePath)) {
    console.log('Validating image file:', imageFilePath)
    try {
      const report = (message: string) => {
        console.log(
          `::error file=${video.filePath},line=1,endLine=1,title=Image validation::${message}`,
        )
      }

      // Only allow file size less than 128KB
      const stats = fs.statSync(imageFilePath)
      if (stats.size > 128 * 1024) {
        report(
          `Image file size is too large: ${stats.size} bytes. Image file size must be less than 128KB.`,
        )
      }

      const image = await Jimp.read(imageFilePath)
      if (image.bitmap.width !== 1280 || image.bitmap.height !== 720) {
        report(
          `Image must be 1280x720, but is ${image.bitmap.width}x${image.bitmap.height}`,
        )
      }
    } catch (e) {
      console.log('Failed to validate image file:', imageFilePath)
    }
  }
}
