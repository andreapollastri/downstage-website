# Social images

Ready-made images to promote Downstage, in the site's neon style and with real screenshots of the app. This folder is not published by Netlify (only `site/` is).

| File | Size | Use it for |
| --- | --- | --- |
| `instagram/post-1080x1350.jpg` | 1080×1350 (4:5) | Instagram and Facebook feed post |
| `instagram/square-1080x1080.jpg` | 1080×1080 (1:1) | Square post: Instagram, Facebook, LinkedIn, Threads, Mastodon |
| `instagram/story-1080x1920.jpg` | 1080×1920 (9:16) | Instagram and Facebook stories, Reels and TikTok cover. The top and bottom 250 px are left to the app's own controls; add the link sticker over the empty area under `downstage.it` |
| `instagram/carousel-1…6-1080x1350.jpg` | 1080×1350 (4:5) | A six-slide carousel: cover, console, recording, rack, effects, download |
| `posts/hero-1920x1080.jpg` | 1920×1080 (16:9) | Posts on X, LinkedIn, Facebook, Mastodon and Bluesky; YouTube thumbnail; Product Hunt gallery |
| `link/og-1200x630.jpg` | 1200×630 (1.91:1) | The preview of a link to downstage.it (Open Graph): the same image is `site/assets/img/og.jpg` |
| `covers/x-header-1500x500.jpg` | 1500×500 | X header. The profile picture covers the lower left, which is kept empty |
| `covers/linkedin-banner-1584x396.jpg` | 1584×396 | LinkedIn profile or page banner. The words are on the right, away from the photo |
| `covers/facebook-cover-1640x624.jpg` | 1640×624 | Facebook page cover. Phones crop the sides: the words stay in the middle 1100 px |
| `covers/youtube-banner-2560x1440.jpg` | 2560×1440 | YouTube channel banner. The words are inside the 1546×423 area every device shows |
| `avatar/avatar-1080x1080.png` | 1080×1080 | Profile picture: the app icon, made to be cut to a circle |

## Captions

Short, for Instagram, Threads, Facebook:

> Downstage is out: a free multitrack recorder and analog-style mixing console for Mac. 48 channels, a 64-slot rack of classic outboard, amps and pedals, 8 FX buses. No account, no subscription. Download it at downstage.it
>
> #Downstage #DAW #HomeStudio #MusicProduction #Mixing #Recording #MacOS #FreeSoftware #AudioEngineering

Longer, for LinkedIn and X:

> I made a DAW. Downstage is a free multitrack recorder and analog-style console for Mac: SSL-style strips on 48 channels, groups, VCAs, cue mixes, a 64-slot rack with 41 units (compressors, console strips, guitar and bass amps, pedals, a 31-band EQ, meters) and eight effect buses — with a demo song to take apart. Apple Silicon, macOS 13 or later. Free at https://downstage.it

In Italian:

> È uscito Downstage: un registratore multitraccia e un mixer in stile analogico per Mac, gratis. 48 canali, un rack da 64 slot con compressori, amplificatori e pedali, 8 bus di effetti. Niente account, niente abbonamento. Si scarica da downstage.it

Alt text for the images: "Downstage, a free DAW for Mac: its mixing console with channel strips, inserts, sends and faders. Record. Mix. Play it loud. downstage.it".

## Change or add an image

Each image is an HTML page in `src/` (the shared style is `src/promo.css`; the screenshots are in `src/img/`, the same as the guide in the app). Edit it, then render with Google Chrome installed:

```bash
node social/src/render.mjs              # every image
node social/src/render.mjs story og     # only the ones whose name contains these words
```

Rendering `og` also writes `site/assets/img/og.jpg`, the link preview of the site. To add a format, add a page to `src/` and a line to `FORMATS` in `src/render.mjs`. When the app changes, copy the new screenshots from `renderer/guide/` of the app repository into `src/img/` and render again. The numbers (48 channels, 64 slots, 41 units, 8 FX buses, version 1.0.0) are written in the pages: keep them true.
