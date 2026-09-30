# Site Data

## Projects (`projects.json`)

An array of portfolio projects shown in the **Selected Work** section of the
homepage. Rendered in array order.

```json
[
  {
    "slug": "my-project",
    "title": "My Project",
    "description": "One or two sentences — what it is and who it's for. No fake metrics.",
    "url": "https://live-site.example.com",
    "video": "/projects/my-project/demo.mp4",
    "poster": "/projects/my-project/poster.webp",
    "year": "2026",
    "role": ["Design direction", "Build & interactions", "AI-assisted development"],
    "stack": ["Next.js", "Tailwind CSS"],
    "caseStudy": false
  }
]
```

| Field         | Required | Notes                                                            |
| ------------- | -------- | ---------------------------------------------------------------- |
| `slug`        | yes      | Unique id, used for keys and future case-study routes            |
| `title`       | yes      | Project name                                                     |
| `description` | yes      | 1–2 sentences, honest description                                |
| `url`         | yes      | Link to the live website                                         |
| `video`       | yes*     | Screen recording of the finished site (mp4/webm), in `public/`   |
| `poster`      | no       | Still frame shown before the video loads                         |
| `year`        | no       | Shown next to the project number                                 |
| `role`        | yes      | What you actually contributed — never invent responsibilities    |
| `stack`       | no       | Specific tools relevant to this project                          |
| `image`       | no       | Screenshot fallback if there's no video (`image` instead of `video`) |
| `caseStudy`   | no       | Reserved for future case-study pages                             |

\* A project needs either `video` or `image`. Video is preferred — visitors
should watch the site in action.

### Adding a project

1. Put the recording in `public/projects/<slug>/demo.mp4` (H.264 mp4, muted,
   ~16:10 or 16:9, ideally under ~15 MB).
2. Add an entry to the array in `projects.json`.
3. Done — the homepage renders it automatically.

## Blog (`blog/posts.json`)

Array of posts rendered at `/blog`. Intentionally kept small — only publish
when there's something real to say. Same shape as before: `slug`, `title`,
`metaTitle`, `metaDescription`, `h1`, `excerpt`, `date`, `readTime`,
`category`, `content` (plain text, `## ` headings, `- ` lists), `relatedSlugs`.
