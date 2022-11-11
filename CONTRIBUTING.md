# Contributing

We are taking a GitOps approach in our [YouTube channel](https://www.youtube.com/@creatorsgarten). The video’s metadata is stored in [data/videos](data/videos). When files are added, removed or modified, the [GitHub Actions workflow](.github/workflows/sync.yml) will update the contents in our YouTube channel accordingly.

By submitting a pull request to this repository you can help us improve and grow our channel!

## Ways you can contribute

- [Add timestamps](#timestamps)
- [Add links to the video description](#reference-links)
- [Improve the thumbnail image](#thumbnail)
- [Add English subtitles](#english-subtitles)

## Timestamps

Adding timestamps to a video can help viewers navigate the contents of the talk more easily.

To add the timestamps, update the description in this format:

```
00:00 | Intro
01:23 | Section A
04:56 | Section B
07:00 | Outro
```

## Reference Links

Adding reference links to a video can help viewers find the resources mentioned in the talk more easily. You can add reference links by updating the description with links in this format:

```
Link title 1
https://…

Link title 2
https://…
```

## Thumbnail

Having good video thumbnails can encourage viewers to watch the video. You can help us improve our thumbnails by submitting a pull request to replace the `.jpg` files in [data/videos](data/videos).

Image requirements:

- Dimensions must be 1280x720
- File extension must be `.jpg`
- Image must be smaller than 128 KB

## English Subtitles

Having English subtitles can help make the talk understandable by non-Thais (international audience). Subtitles can be added by creating a `[slug]_en.vtt` file in [data/videos](data/videos).

- You can autogenerate an English subtitles from a Thai video using [whisper-youtube](https://github.com/ArthurFDLR/whisper-youtube). It is a machine learning model that can generate English subtitles from videos in any language.
- You can use [happyscribe](https://www.happyscribe.com/subtitle-tools/online-subtitle-editor) to edit your subtitles using a free, web-based tool.
