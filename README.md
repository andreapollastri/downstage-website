# downstage.it

The website of [Downstage](https://downstage.it) and the place its builds are published from: the disk image people download and the zipped app plus the signed update manifest the app reads to update itself.

```
site/                    what Netlify publishes
  index.html             the home page (its download box is filled in by the release)
  terms.html             built from LICENSE.md in the app repository
  privacy.html           built from PRIVACY.md in the app repository
  llms.txt               a plain summary for language models (llmstxt.org)
  downloads/             the .sha256 of the current disk image and zip
  updates/latest.json    the update manifest, signed with the update key
netlify.toml             publish folder, redirects and headers
```

Netlify deploys this repository from GitHub on every push to `main` (publish directory `site`, no build command, both from `netlify.toml`).

The disk image and the zip are **not in the repository** (GitHub refuses files over 100 MB): they are assets of the GitHub release `v<version>` of this repository, and `netlify.toml` sends `https://downstage.it/downloads/<file>` there with a redirect, so every link — the download button, `/download`, the update manifest — stays on downstage.it. GitHub serves them without using Netlify's bandwidth.

## Release a new version

In the app repository (`downstage`, next to this one), with the version bumped in its `package.json` and `gh` logged in:

```bash
npm run build:mac                                   # signs with the Developer ID and notarizes
node scripts/release.mjs --notes "What changed"
cd ../downstage-website && git add -A && git commit -m "Downstage <version>" && git push
```

`release.mjs` checks that the app is that version, notarized, and that its audio engine passes the self-test; makes the disk image (signed and notarized too) and the zip; uploads both to the GitHub release `v<version>`; and writes here their checksums, `site/updates/latest.json` signed with the update key, the download box, the `/download` redirect and the release the `/downloads/` rule points at. The push publishes it.

The update key is created once with `node scripts/release.mjs --keygen` in the app repository: the private key stays in `~/.downstage/update-signing-key.pem` (back it up, never commit it), the public key ships in the app. Installed copies only accept updates signed with it. Signing and notarization use the Developer ID certificate in the keychain and the notarytool profile `downstage-notary`.

If `LICENSE.md` or `PRIVACY.md` change, rebuild the legal pages from the app repository with `node scripts/site-legal.mjs`, then commit and push.

## Netlify

The site is linked to this GitHub repository: every push to `main` is deployed. Site settings, once, in the Netlify dashboard: `downstage.it` as the primary domain (`www` redirecting to it) with HTTPS (Let's Encrypt, automatic); the app only accepts updates over `https://downstage.it`. `netlify.toml` sets the headers: the update manifest is never cached.

## How the app updates

At startup (at most every six hours) and from **Downstage → Check for Updates…** the app fetches `https://downstage.it/updates/latest.json`, verifies its Ed25519 signature with the public key it carries, and compares the version. If a newer one is out it asks; on Install it downloads the zip from the same site with the progress in the Dock, checks size, SHA-256, version and the engine self-test, and swaps the app when Downstage quits (right away on Restart Now, after saving the session). A copy running from Downloads or from the disk image is offered a move to Applications first, or the disk image to install by hand. **Check for Updates Automatically** in the same menu turns the startup check off.
