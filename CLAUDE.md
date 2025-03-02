# Videos Repository Guide

## Commands
- `./bin/sync` - Check and sync video metadata with YouTube (run with `--confirm` to apply changes)
- `./bin/import -e EVENT -s SLUG -v VIDEO_ID` - Import a YouTube video with specified event, slug, and video ID
- `./bin/publish` - Generate videos.json data file (use `--upload` to publish to gh-pages)
- `./bin/validate-thumbnails` - Validate thumbnail dimensions (1280x720) and file size (<128KB)
- `./bin/import-thumbnails` - Import thumbnail images from YouTube
- `pnpm install` - Install dependencies

## Code Style
- TypeScript with strict mode enabled
- ES modules with named exports
- Zod for schema validation
- Organized by event in data/videos/ directory
- Video metadata in .md files with frontmatter (title, speaker, YouTube ID, etc.)
- Thumbnail requirements: 1280x720px JPEG format, <128KB size
- Optional subtitle files in VTT format (with _en.vtt or _th.vtt suffixes)
- GitOps workflow - changes are synchronized with YouTube via automated scripts