

## The Trade-off

Right now the XML is bundled into JavaScript via `?raw` import. This means **any change to the file requires a rebuild** — you can't just swap it on the server.

To make the file swappable without rebuilding, it needs to go back to `public/` where it's fetched at runtime. That's exactly how it worked before we moved it.

### Two options:

**Option A: Move back to `public/` (swappable, but publicly accessible)**
- Move `src/data/asctt2012.xml` → `public/data/asctt2012.xml`
- Revert `xmlParser.ts` to fetch the file at runtime via `fetch()`
- You can then replace the file on GitHub and the deployed site updates after deploy — no rebuild of the JS bundle needed
- Downside: the file is directly downloadable at `/data/asctt2012.xml`

**Option B: Keep bundled (more private, but requires rebuild on change)**
- Current setup — file is embedded in JS
- Any change to the XML on GitHub triggers a full rebuild before it takes effect
- Less directly accessible, but still extractable from the JS bundle

### Recommendation

Since this is a **school schedule** (generally public information), Option A is practical and makes updates easy. You'd just commit the new XML file to GitHub, the deploy runs, and the new schedule is live — without needing to touch any code.

Shall I move it back to `public/` for easy swapping?

