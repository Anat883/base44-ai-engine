# AI Storyboard Video Starter

A beginner-friendly system for creating longer AI videos by breaking them into short, controlled shots.

## Why this exists

AI video models struggle with long, continuous videos. The trick is to break your video into short shots, generate a first and last frame for each shot, then produce the video between those locked anchors. This repository gives you a repeatable folder system to do that.

## Who this is for

Total beginners who want a repeatable folder system for AI video projects. No filmmaking background needed.

## What you can make

- Product demos
- SaaS explainer videos
- Character-driven stories
- Cinematic shorts
- Promotional content

## Getting started

### Option 1 — Claude Code (recommended for beginners)

Paste this repo URL into Claude Code and say "set this up". Claude will run the setup script and walk you through the workflow.

### Option 2 — Browse the finished example

Open `examples/masterchef-pink-cup/` and click through the folders in order. This is a finished storyboard video project so you can see what each step looks like.

### Option 3 — Create your own project

```bash
tools/create-project.sh my-video-name
```

Then open `projects/my-video-name/` and start at `01-creative-brief/`.

### Option 4 — Full beginner setup

```bash
tools/setup-environment.sh --open
```

This creates a finished demo you can click through and a blank project for your own video.

## The nine-step workflow

| Step | Folder | What you do |
|---|---|---|
| 1 | `01-creative-brief/` | Write the story, goal, and mood |
| 2 | `02-references/` | Collect images for style and consistency |
| 3 | `03-shot-list/` | Break the story into short shots |
| 4 | `04-image-prompts/` | Write prompts for first and last frames |
| 5 | `05-storyboard-frames/` | Generate and approve the frames |
| 6 | `06-video-prompts/` | Write prompts to animate each shot |
| 7 | `07-transition-videos/` | Generate and approve the video clips |
| 8 | `08-stitching/` | Arrange and join the clips |
| 9 | `09-final-output/` | Export and share the final video |

## Folder rules

Every step uses three folders:

```
attempts/     rough drafts go here
approved/     locked files go here
disapproved/  rejected files go here
```

**Only build the next step from files in `approved/`.** This keeps the project clean and makes it easy to backtrack.

## Saving to GitHub

```bash
tools/save-to-github.sh "Save storyboard project progress"
```

## Tips

- Generate storyboard frames before video. Locked frames make better video prompts.
- Use reference images for consistent characters and products across shots.
- Keep rejected versions. They are useful for learning and for explaining decisions.
- The final video is the result of many small approvals.
