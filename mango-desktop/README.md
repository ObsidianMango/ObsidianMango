# Mango Windows 3.1

A static, touch-friendly Program Manager for Steve’s ObsidianMango projects.

Live URL: https://obsidianmango.github.io/ObsidianMango/mango-desktop/

The website source is `index.html`, `desktop.css`, `desktop.js`, `catalog.json`, `icon.svg`, `apple-touch-icon.png` and `manifest.webmanifest`. No build step or external runtime libraries are needed. Serve this directory with any static web server.

## Features

- 241 existing app and game shortcuts, organized into nine program groups.
- Movable and resizable windows, minimize/restore, maximize, cascade and tile.
- Program search, Favorites, Recently Used, custom shortcuts and custom groups.
- Rename or move a shortcut through Properties; mouse users can also drag a shortcut onto a desktop group.
- Touchscreens open items with one tap. Mouse activation supports single or double click.
- Apps can open inside desktop windows or in their own browser tab. Some apps require their own tab for browser permissions or full device features.
- Display colors, desktop patterns, interface size, optional scanlines, clock format, optional sounds and an idle screensaver.
- Settings and layout save in localStorage. JSON backup/restore includes desktop preferences, custom groups/shortcuts, Favorites and window layout. Individual apps own their game saves and audio settings.
- iPhone Home Screen icon and standalone display manifest.

## Catalog maintenance

`catalog.json` is a curated snapshot of the public project entry points. Entries have a stable `id`, either `path` (relative to the ObsidianMango Pages root) or an absolute `url`, `title`, `group`, `description` and `icon`. Add new published projects there to update every visitor’s catalog. Custom shortcuts made in the desktop are personal to the browser; export them to transfer between devices.

Keep test fixtures, archived releases and intentionally retired projects out of the public catalog. Keep older project versions under clear edition names. Do not replace the existing game files.

## Verification

The initial release was checked for JavaScript syntax, unique catalog IDs, valid group assignments and repository target existence. Browser QA covered search, embedded launching, custom shortcut creation and properties, settings persistence, list/icon views and a 390px-wide phone layout.

Independent web desktop inspired by Windows 3.1; not affiliated with Microsoft.
