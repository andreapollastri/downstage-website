// Renders the social images from the HTML pages in this folder with headless
// Google Chrome, into the folders next to it (social/<group>/<name>.jpg).
// The link preview also becomes the site's og.jpg.
//
// node social/src/render.mjs            every format
// node social/src/render.mjs story og   only the formats whose name contains one of these words

import { spawn, execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const here = path.dirname(new URL(import.meta.url).pathname);
const social = path.resolve(here, "..");
const site = path.resolve(social, "..", "site");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// [output, page, width, height]
const FORMATS = [
  ["instagram/post-1080x1350", "post.html", 1080, 1350],
  ["instagram/square-1080x1080", "square.html", 1080, 1080],
  ["instagram/story-1080x1920", "story.html", 1080, 1920],
  ["instagram/carousel-1-1080x1350", "carousel-1.html", 1080, 1350],
  ["instagram/carousel-2-1080x1350", "carousel-2.html", 1080, 1350],
  ["instagram/carousel-3-1080x1350", "carousel-3.html", 1080, 1350],
  ["instagram/carousel-4-1080x1350", "carousel-4.html", 1080, 1350],
  ["instagram/carousel-5-1080x1350", "carousel-5.html", 1080, 1350],
  ["instagram/carousel-6-1080x1350", "carousel-6.html", 1080, 1350],
  ["posts/hero-1920x1080", "hero.html", 1920, 1080],
  ["link/og-1200x630", "og.html", 1200, 630],
  ["covers/x-header-1500x500", "x-header.html", 1500, 500],
  ["covers/linkedin-banner-1584x396", "linkedin.html", 1584, 396],
  ["covers/facebook-cover-1640x624", "facebook.html", 1640, 624],
  ["covers/youtube-banner-2560x1440", "youtube.html", 2560, 1440],
  ["avatar/avatar-1080x1080", "avatar.html", 1080, 1080],
];

const wanted = process.argv.slice(2);
const jobs = FORMATS.filter(([name]) => !wanted.length || wanted.some((word) => name.includes(word)));
if (!jobs.length) { console.error("No format matches " + wanted.join(" ")); process.exit(1); }
if (!fs.existsSync(CHROME)) { console.error("Google Chrome not found at " + CHROME + " (set CHROME)"); process.exit(1); }

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "downstage-social-"));

// Headless Chrome writes the screenshot but does not always exit: wait for the
// file to stop growing, then stop the whole process group.
async function shoot(page, width, height, png) {
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    "--window-size=" + width + "," + height, "--virtual-time-budget=4000",
    "--user-data-dir=" + path.join(tmp, "profile"), "--no-first-run", "--no-default-browser-check",
    "--screenshot=" + png, "file://" + path.join(here, page),
  ], { detached: true, stdio: "ignore" });
  let size = -1;
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    const now = fs.existsSync(png) ? fs.statSync(png).size : 0;
    if (now > 0 && now === size) break;
    size = now;
  }
  try { process.kill(-chrome.pid, "SIGKILL"); } catch {}
  if (!(size > 0)) throw new Error("Chrome wrote no screenshot of " + page);
}

for (const [name, page, width, height] of jobs) {
  const png = path.join(tmp, path.basename(name) + ".png");
  await shoot(page, width, height, png);
  const avatar = name.startsWith("avatar/");
  const file = path.join(social, name + (avatar ? ".png" : ".jpg"));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (avatar) fs.copyFileSync(png, file);
  else execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "92", png, "--out", file], { stdio: "ignore" });
  if (name.startsWith("link/og-")) {
    execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "84", png, "--out", path.join(site, "assets", "img", "og.jpg")], { stdio: "ignore" });
  }
  console.log(path.relative(social, file) + "  " + width + "×" + height + "  " + Math.round(fs.statSync(file).size / 1024) + " KB");
}
fs.rmSync(tmp, { recursive: true, force: true });
