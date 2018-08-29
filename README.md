# vscodist for Todoist

Create Todoist tasks directly from VS Code

>NOTE: this extension is not created by, affiliated with, or supported by Doist

## Features

- add Todoist task with reference to the current line or selected text,
- open quick add task dialog (requires official Todoist desktop app) with current line reference or selected text,
- open inbox (requires official Todoist desktop app).

### Available commands
- `VSCodist: Set API key` sets required Todoist API key
- `VSCodist: Add Task` adds a task to an inbox with selected text as a content
- `VSCodist: Open Quick Add`  add Todoist task via desktop client app quick add
- `VSCodist: Open Inbox` open inbox in desktop client app

## Requirements

- valid Todoist API key (can be found in `Todoist Settings -> Integration`),
- official dektop app installed (when using bridge functions between extension and official client)

## Extension Settings

This extension contributes the following settings:

* `vscodist.apikey`: Todoist API key

## Known Issues

- Some URI schemes required to open native Todoist client does not work (at least on MAC OS). It prevents to implement some features like open `Next 7 days` panel,
- This extension relies on `beta.todoist.com` REST API.

## Roadmap
- choose the project where newly added tasks should land in (currently this is inbox),
- tests, tests, tests!

## Release Notes

### 0.0.1

Initial release

-----------------------------------------------------------------------------------------------------------

**Enjoy!**
