# Data Extractor

Some records live across several pages, and copying them into a spreadsheet
means a lot of clicking back and forth. This Chrome extension captures the
fields you care about from each page, joins them into a single row, and copies
it in a format you can paste straight into Excel.

It is configuration-driven: the columns, the pages, and the CSS selectors all
live in one file, so pointing it at a different site means editing config, not
code.

## Folder structure

```
.
├── manifest.json       Extension setup: name, version, permissions, popup
├── config.example.js   What to capture: columns, pages, CSS selectors
├── popup.html          The popup window and its styling
├── popup.js            The logic: capture, save, copy, clear
└── icons/              Toolbar icons
```

## Setup

1. Copy the example config — your own copy is gitignored:

   ```sh
   cp config.example.js config.js
   ```

2. Edit `config.js` so the selectors match the site you want to read, and
   update `host_permissions` in `manifest.json` to that site's origin.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode** (top right).
5. Click **Load unpacked** and pick this folder.
6. Pin "Data Extractor" to the toolbar so it's easy to reach.

After editing any file, go back to `chrome://extensions` and hit the reload
icon on the extension card.

## How to use it

1. Open a record page on the site.
2. Click the extension icon. The top right shows which page was recognised.
3. Click **Capture from this page**.
4. Move to the next page and capture again — values build up into one row.
5. Once every column is filled, the row is saved and copied automatically.
   Otherwise use **Save row** and **Copy rows** yourself.
6. Paste into Excel. **Clear** wipes everything and starts over.

Pages that define a `verify` field are matched against the record ID. If a page
belongs to a different record than the one already in the draft, nothing is
captured and you'll see a warning — so two records can't silently merge into
one row.

## Changing what gets captured

Everything lives in `config.js`.

- `columns` — the column order used when copying.
- `pages` — one entry per page, with a `match` pattern for the URL and a
  `fields` map of column name to CSS selector.

Anchor each `match` to the full origin (`/^https:\/\/example\.com\/records\/detail/i`)
rather than the path alone. A path-only pattern would let any site serving that
path pose as a recognised page and feed values into your row.

To add a field, find its selector in the browser (right click → Inspect) and
add a line under that page's `fields`. Add the column name to `columns` too.

Optional bits on a field:

- `label` — fallback that looks up the value by its row label in a table.
- `attr` — read an HTML attribute instead of the text.
- `regex` — pull just part of the text out.
- `transform` — tidy the value up; `courseName` and `longDate` are built in
  (see `TRANSFORMS` in `popup.js`).

A page can also declare `verify`: a field that is read and compared against the
draft, but never written to a column. It is what stops two different records
being merged.

## Notes

Everything stays on your machine — captured values live in
`chrome.storage.local` and on your clipboard, and the extension makes no
network requests. It reads only the pages you point it at, and only when you
click **Capture**.

Saved rows persist in local storage until you click **Clear**, so if you capture
personal data, clear the buffer when you're done rather than leaving it there.

Values beginning with `=`, `+`, `-` or `@` are prefixed with an apostrophe when
copied, so text from a page can't paste into Excel as a live formula.

This repository ships a generic example configuration and is not affiliated
with, or targeted at, any particular site or organisation.

## License

MIT — see [LICENSE](LICENSE).
