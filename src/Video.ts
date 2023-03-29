import path from 'path'
import { globby } from 'globby'
import grayMatter from 'gray-matter'
import { z } from 'zod'
import fs from 'fs'

const VideoFrontMatter = z.object({
  title: z.string().describe('The talk title.'),
  youtubeTitle: z
    .union([
      z.string(),
      z.object({
        en: z.string(),
        th: z.string(),
      }),
    ])
    .optional()
    .describe(
      'Customized title for YouTube. If not specified, the talk title will be used.',
    ),
  speaker: z.string().optional(),
  tagline: z.string().optional(),
  team: z
    .object({
      name: z.string(),
    })
    .optional(),
  type: z.enum(['talk', 'pitch', 'archive']).default('talk'),
  youtube: z.string(),
  managed: z.boolean(),
  description: z.string().optional(),
  englishDescription: z.string().optional(),
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
      const imageFilePath = getDefaultImageFilePath({ filePath })
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

export function getDefaultImageFilePath(video: Pick<Video, 'filePath'>) {
  return video.filePath.replace(/\.md$/, '.jpg')
}
