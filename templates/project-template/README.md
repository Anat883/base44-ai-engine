# New Storyboard Video Project

A beginner-friendly workflow for creating storyboard videos, organized into nine sequential steps from creative brief through final output.

## First question

Before you start, answer this:

> Do you want approval at every step, or should I use autopilot and only stop if something is risky or unclear?

Write your answer in `00-admin/approval-log.md`.

## Folder rules

Every important folder has three subfolders:

```
attempts/     rough drafts go here
approved/     locked files go here
disapproved/  rejected files go here
```

Only build the next step from files in `approved/`. This keeps the project clean and makes it easy to backtrack.

## Nine steps

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

## Finished example

A completed demo project is available at `../demo-walkthrough/`. Run `tools/setup-environment.sh` to set it up if it is not already there.
