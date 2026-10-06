# downstage.it

The website of [Downstage](https://downstage.it) and the place its builds are published from: the disk image people download and the zipped app plus the signed update manifest the app reads to update itself.

```
site/                    what Netlify publishes
  index.html             the home page (its download box is filled in by the release)
  terms.html             built from LICENSE.md in the app repository
  privacy.html           built from PRIVACY.md in the app repository
  llms.txt               a plain summary for language models (llmstxt.org)
  downloads/             Downstage-<version>-macOS-arm64.dmg and .zip, with their .sha256
  updates/latest.json    the update manifest, signed with the update key
netlify.toml             publish folder, redirects (/download, /terms, /privacy) and headers
```

The disk image and the zip are **not committed** (GitHub refuses files over 100 MB): they live in `site/downloads/` on the machine that releases and reach Netlify with the CLI deploy below. Their checksums and `updates/latest.json` are committed.

## Release a new version

In the app repository (`downstage`, next to this one), with the version bumped in its `package.json`:

```bash
npm run build:mac
node scripts/release.mjs --notes "What changed in this version"
```

`release.mjs` checks that the bundle is that version and that its audio engine passes the self-test, writes the disk image and the zip into `site/downloads/` (and removes the previous ones), writes `site/updates/latest.json` signed with the update key, and updates the download box and the `/download` redirect. `npm run build:dmg` runs both steps without notes.

The update key is created once with `node scripts/release.mjs --keygen` in the app repository: the private key stays in `~/.downstage/update-signing-key.pem` (back it up, never commit it), the public key ships in the app. Installed copies only accept updates signed with it.

If `LICENSE.md` or `PRIVACY.md` change, rebuild the legal pages from the app repository with `node scripts/site-legal.mjs`.

Then deploy (below) and commit this repository.

## Deploy on Netlify

The site is static: no build command, `site/` is published as it is.

First time, on this machine:

```bash
npm install -g netlify-cli
netlify login
netlify link            # pick the existing downstage.it site, or `netlify init` to create one
```

Every release:

```bash
netlify deploy --prod   # uploads site/, disk image and zip included
```

`netlify deploy` without `--prod` publishes a draft URL to check first.

Site settings, once, in the Netlify dashboard:

- **Domain management**: `downstage.it` as the primary domain (and `www.downstage.it` redirecting to it), with Netlify DNS or the registrar's DNS pointing at Netlify; HTTPS is issued automatically (Let's Encrypt). The app only accepts updates over `https://downstage.it`.
- **Build & deploy**: if the repository is also linked for continuous deployment, leave the build command empty and the publish directory `site` (from `netlify.toml`). A Git-only deploy does not carry the disk image and the zip, so release with the CLI.
- **Headers**: `netlify.toml` sets them — the update manifest is never cached, downloads are served as attachments.

## How the app updates

At startup (at most every six hours) and from **Downstage → Check for Updates…** the app fetches `https://downstage.it/updates/latest.json`, verifies its Ed25519 signature with the public key it carries, and compares the version. If a newer one is out it asks; on Install it downloads the zip from the same site with the progress in the Dock, checks size, SHA-256, version and the engine self-test, and swaps the app when Downstage quits (right away on Restart Now, after saving the session). A copy running from Downloads or from the disk image is offered a move to Applications first, or the disk image to install by hand. **Check for Updates Automatically** in the same menu turns the startup check off.
