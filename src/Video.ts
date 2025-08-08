import fs from 'fs'
import { globby } from 'globby'
import grayMatter from 'gray-matter'
import path from 'path'
import { z } from 'zod'

export const LocalizableText = z.union([
  z.string(),
  z.object({
    en: z.string(),
    th: z.string(),
  }),
])
export type LocalizableText = z.infer<typeof LocalizableText>

const VideoFrontMatter = z.object({
  title: z.string().describe('The talk title.'),
  youtubeTitle: LocalizableText.optional().describe(
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
  published: z
    .union([z.boolean(), z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z)?$/)])
    .optional(),
  language: z.enum(['en', 'th']).default('th'),
  subtitles: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  chapters: z.record(LocalizableText).optional(),
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
    public thaiSubtitlePath?: string,
    public videoLanguage?: 'en' | 'th',
  ) {}
  static async findAll() {
    const paths = await globby(['data/videos/**/*.md'])
    const videos: Video[] = []
    for (const filePath of paths) {
      try {
        const slug = path.basename(filePath, '.md')
        const event = path.basename(path.dirname(filePath))
        const parsed = grayMatter.read(filePath)
        const { data, content } = parsed
        const imageFilePath = getDefaultImageFilePath({ filePath })
        const englishSubtitlePath = filePath.replace(/\.md$/, '_en.vtt')
        const thaiSubtitlePath = filePath.replace(/\.md$/, '_th.vtt')
        videos.push(
          new Video(
            filePath,
            event,
            slug,
            VideoFrontMatter.parse(data),
            content,
            fs.existsSync(imageFilePath) ? imageFilePath : undefined,
            fs.existsSync(englishSubtitlePath) ? englishSubtitlePath : undefined,
            fs.existsSync(thaiSubtitlePath) ? thaiSubtitlePath : undefined,
            data.language,
          ),
        )
      }
      catch (e) {
        console.error('Unable to process video file', filePath)
        throw e
      }
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
      thaiSubtitlePath: this.thaiSubtitlePath,
    }
  }
}

export function getDefaultImageFilePath(video: Pick<Video, 'filePath'>) {
  return video.filePath.replace(/\.md$/, '.jpg')
}
