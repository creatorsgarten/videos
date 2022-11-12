import path from 'path'
import { globby } from 'globby'
import grayMatter from 'gray-matter'
import { z } from 'zod'
import fs from 'fs'

const VideoFrontMatter = z.object({
  title: z.string(),
  speaker: z.string(),
  youtube: z.string(),
  managed: z.boolean(),
  description: z.string().optional(),
  published: z.boolean().optional(),
  subtitles: z.array(z.string()).optional(),
})
type VideoFrontMatter = z.infer<typeof VideoFrontMatter>

export class Video {
  constructor(
    public filePath: string,
    public event: string,
    public slug: string,
    public data: VideoFrontMatter,
    public content: string,
    public imageFilePath?: string,
    public englishSubtitlePath?: string,
  ) {}
  static async findAll() {
    const paths = await globby(['data/videos/**/*.md'])
    const videos: Video[] = []
    for (const filePath of paths) {
      const slug = path.basename(filePath, '.md')
      const event = path.basename(path.dirname(filePath))
      const parsed = grayMatter.read(filePath)
      const { data, content } = parsed
      const imageFilePath = filePath.replace(/\.md$/, '.jpg')
      const englishSubtitlePath = filePath.replace(/\.md$/, '_en.vtt')
      videos.push(
        new Video(
          filePath,
          event,
          slug,
          VideoFrontMatter.parse(data),
          content,
          fs.existsSync(imageFilePath) ? imageFilePath : undefined,
          fs.existsSync(englishSubtitlePath) ? englishSubtitlePath : undefined,
        ),
      )
    }
    return videos
  }
  toJSON() {
    return {
      event: this.event,
      slug: this.slug,
      data: this.data,
      content: this.content,
      filePath: this.filePath,
      imageFilePath: this.imageFilePath,
      englishSubtitlePath: this.englishSubtitlePath,
    }
  }
}
