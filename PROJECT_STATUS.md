# Project Status

## 2026-10-26

- MVP implemented as a dependency-free static PWA for iOS Safari.
- Node syntax checks and 15 automated tests pass.
- Verified at a 390 x 844 mobile viewport without horizontal overflow.
- Verified search/link parsing, Bilibili redirects, theme persistence, local favorites, and Service Worker shell fallback.
- Fixed the favorites empty state so the `hidden` attribute always wins over component display styles.
- Updated the Service Worker to cache version 2 and prefer fresh same-origin assets while falling back to the cache offline.
- Remote GitHub repository and GitHub Pages deployment are pending publication from this checkout.

## Known boundaries

- This project is an unofficial web entry point, not a full PiliPlus native-client replacement.
- It does not provide in-app Bilibili authentication, danmaku, comments, account-synced favorites, native playback, or offline video.
- Bilibili content and access behavior remain controlled by Bilibili and the user's browser session.
