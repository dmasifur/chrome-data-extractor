# Data Extractor

A Chrome extension that grabs student fields from a few different pages on
`aibl.rtomanager.com.au`, joins them into a single row, and copies it in a
format you can paste straight into Excel.

## Folder structure

```
.
├── manifest.json   Extension setup: name, version, permissions, popup
├── config.js       What to capture: columns, pages, CSS selectors
├── popup.html      The popup window and its styling
└── popup.js        The logic: capture, save, copy, clear
```

## Setup

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick this folder.
4. Pin "Data Extractor" to the toolbar so it's easy to reach.

After editing any file, go back to `chrome://extensions` and hit the reload
icon on the extension card.

## How to use it

1. Open a student page on the site.
2. Click the extension icon. The top right shows which page was recognised.
3. Click **Capture from this page**.
4. Move to the next page and capture again — values build up into one row.
5. Once every column is filled, the row is saved and copied automatically.
   Otherwise use **Save row** and **Copy rows** yourself.
6. Paste into Excel. **Clear** wipes everything and starts over.

Pages 1 and 2 are matched against the student ID. If they belong to different
students, nothing is captured and you'll see a warning.

## Changing what gets captured

Everything lives in `config.js`.

- `columns` — the column order used when copying.
- `pages` — one entry per page, with a `match` pattern for the URL and a
  `fields` map of column name to CSS selector.

To add a field, find its selector in the browser (right click → Inspect) and
add a line under that page's `fields`. Add the column name to `columns` too.

Optional bits on a field:

- `label` — fallback that looks up the value by its row label in a table.
- `attr` — read an HTML attribute instead of the text.
- `regex` — pull just part of the text out.
- `transform` — tidy the value up; `courseName` and `longDate` are built in
  (see `TRANSFORMS` in `popup.js`).

If you point the extension at a different site, update `host_permissions` in
`manifest.json` to match.
