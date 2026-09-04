# Weekly blog — how to add a post

The blog is plain static HTML in `public/blog/`. It does **not** go through the
Next build, `globals.css`, or Tailwind. `next export` copies `public/` straight
into `out/`, and the existing GitHub Actions workflow publishes `out/` to
GitHub Pages. So: add files, commit to `main`, and it's live in ~1–2 minutes.

```
public/blog/
  index.html      the post list (edit this every week)
  style.css       shared styles (rarely touched)
  <slug>.html     one file per post

blog-template/     NOT deployed — this folder
  post-template.html
  README.md
```

## Steps for a new post

1. **Copy the template**

   ```
   cp blog-template/post-template.html public/blog/<slug>.html
   ```

   `<slug>` = lowercase words joined by hyphens, e.g.
   `why-students-cant-sleep-before-exams`. It becomes the URL:
   `https://dreamsg.org/blog/<slug>`.

2. **Fill in the post file.** Replace every ALL-CAPS placeholder:
   - `<title>` and `<meta name="description">`
   - `<h1>` title and the `.meta` line (date, week number, approx word count)
   - Body: 800–1000 words, `<h2>` section headings + `<p>` paragraphs, `<ul><li>` for lists
   - 2–3 real source links in the `.sources` block (Sleep Foundation, Mayo Clinic, NIH/NINDS/NIGMS, CDC, peer-reviewed reviews)
   - Keep the `.cta` and `.disclaimer` blocks exactly as they are

3. **Add it to the index.** In `public/blog/index.html`, paste a new `<li>` at the
   **top** of `<ul class="post-list">` (newest first):

   ```html
   <li>
     <a class="title" href="/blog/<slug>">POST TITLE</a>
     <span class="date">MONTH DAY, YEAR &middot; Week N</span>
     <p class="excerpt">One or two sentence summary.</p>
   </li>
   ```

4. **Check locally (optional):** `npm run export` then open
   `out/blog/index.html`, or just open `public/blog/<slug>.html` in a browser.

5. **Publish:**

   ```
   git add public/blog
   git commit -m "Blog: <post title>"
   git push origin main
   ```

## Content rules (compliance)

Write about sleep / circadian science as **fact**. Do not say the product or
melatonin:

- cures, treats, fixes, heals, or prevents anything
- improves, boosts, enhances, restores, or optimises sleep / health
- is better than, safer than, or more effective than any alternative
- helps with any named condition (insomnia, anxiety, jet lag as a "treatment", etc.)

Allowed: neutral description of what melatonin is, how the circadian system
works, what research has measured, and general sleep-habit information that is
widely published by the cited sources.

The **only** product mention per post is this exact sentence, near the end:

> DREAM's melatonin strips use 2mg — the standard dose for sleep support.

Followed by the CTA block and the disclaimer, both already in the template.

## Topic rotation

- Week 1 — Understanding Your Circadian Rhythm *(published)*
- Week 2 — Why Students Can't Sleep Before Exams
- Week 3 — The Science of Melatonin: How It Works
- Week 4 — Irregular Sleep Schedules: What Actually Helps
- Week 5 — back to Week 1's topic with a fresh angle, or a new topic

## Editing styles

`public/blog/style.css` is the whole design. Palette and fonts already match the
main site (black ground, `#ff3b30` red accent, Playfair Display + Inter). Body
text is off-white on purpose so long posts stay readable.
