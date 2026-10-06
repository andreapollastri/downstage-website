# Downstage

[Downstage](https://downstage.it) is a free DAW for Mac: a multitrack recorder and an analog-style mixing console in one window. It is made by [Andrea Pollastri](https://web.ap.it).

Up to 48 channels, with takes, punch-in, comping, tempo detection and quantize. The mixer is a large-format desk (big-desk strips, groups, VCAs, cue mixes). Beside it sit a 64-slot rack of 65 classic units — compressors, a mastering chain, console strips, guitar and bass amps, a six-slot board of 33 pedals — and eight effect buses, including a Crystal Hall with its remote. Edit, Mix, FX or Rack can each fill a screen of their own. There is a built-in guide in six languages and a demo song.

It runs on Apple Silicon with macOS 13 Ventura or later. It is free for personal and professional use, including commercial releases. It is licensed, not sold, and it is not open source. It works offline: no account, no plugins, no telemetry. The only call it makes on its own is a check for a newer version on this site, and that can be turned off.

The app itself lives in a separate repository, `downstage`, next to this one. This repository is the website and the place a release is published from.

## How this repository is laid out

Netlify publishes only `site/`. Everything else stays in the repo.

```
site/                         the site at downstage.it
  index.html                  home: features, screenshots, download, FAQ
  terms.html                  license, built from LICENSE.md in the app repo
  privacy.html                privacy notice, built from PRIVACY.md there
  404.html
  docs/                       the same guide as in the app (F1), six languages
    index.html                English
    it/ fr/ de/ es/ pt/       the other five
    img/                      screenshots used by the guide
  assets/
    site.css  site.js         the site
    docs.js                   the guide (toc, language, zoomed shots)
    img/                      home-page shots, icon, og.jpg
  downloads/                  checksums of the current disk image and zip
  updates/latest.json         the update manifest, signed, read by the app
  llms.txt                    a plain summary for language models
  sitemap.xml  robots.txt
  site.webmanifest  favicon.ico
scripts/
  build-docs.mjs              rebuilds site/docs from the app's guide
social/                       promo images; not published (see social/README.md)
netlify.toml                  publish folder, redirects, headers
```

The disk image and the zip are not committed. GitHub refuses files over 100 MB, so they are assets of the GitHub release `v<version>`, and `netlify.toml` redirects `https://downstage.it/downloads/<file>` there. The `.sha256` files next to that redirect are committed and served as they are. A push to `main` deploys the site; there is no build step.

`scripts/build-docs.mjs` reads the guide from the app repository (`../downstage`, or `DOWNSTAGE_APP`) and writes `site/docs/`. The legal pages are produced the same way, from the app repo, with `node scripts/site-legal.mjs`.

## Release a new version

In the app repository, with the version bumped in its `package.json` and `gh` logged in:

```bash
npm run build:mac                                   # signs with the Developer ID and notarizes
node scripts/release.mjs --notes "What changed"
cd ../downstage-website && git add -A && git commit -m "Downstage <version>" && git push
```

`release.mjs` checks that the app is that version, notarized, and that its audio engine passes the self-test. It makes the disk image (signed and notarized too) and the zip, uploads both to the GitHub release `v<version>`, and writes here their checksums, `site/updates/latest.json` signed with the update key, the download box and the structured data on the home page, the sitemap date, the `/download` redirect and the release the `/downloads/` rule points at. The push publishes it.

The update key is created once with `node scripts/release.mjs --keygen` in the app repository. The private key stays in `~/.downstage/update-signing-key.pem` (back it up; never commit it). The public key ships in the app, and installed copies only accept updates signed with it. Signing and notarization use the Developer ID certificate in the keychain and the notarytool profile `downstage-notary`.

If `LICENSE.md` or `PRIVACY.md` change, rebuild the legal pages from the app repository with `node scripts/site-legal.mjs`, then commit and push.

## Netlify

The site is linked to this GitHub repository: every push to `main` is deployed from `site/`, with no build command, as set in `netlify.toml`. In the Netlify dashboard, once: `downstage.it` as the primary domain (`www` redirecting to it) with HTTPS. The app only accepts updates over `https://downstage.it`. The update manifest is sent with `Cache-Control: no-cache`, so a new release is seen at once.

## How the app updates

At startup (at most every six hours) and from **Downstage → Check for Updates…** the app fetches `https://downstage.it/updates/latest.json`, verifies its Ed25519 signature with the public key it carries, and compares the version. If a newer one is out it asks. On Install it downloads the zip from the same site, with the progress in the Dock, checks size, SHA-256, version and the engine self-test, and swaps the app when Downstage quits (right away on Restart Now, after saving the session). A copy running from Downloads or from the disk image is offered a move to Applications first, or the disk image to install by hand. **Check for Updates Automatically** in the same menu turns the startup check off.
