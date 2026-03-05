

## Plan: XML file validation with user-friendly error messages

### Changes

**1. `src/lib/xmlParser.ts`** — Add validation after XML parsing:
- After `parseFromString`, check if `<cards>` section exists (`xmlDoc.querySelectorAll('card').length`)
- If no cards found, throw a specific error (e.g., `new Error('XML_INCOMPLETE: No cards section found')`)
- Also strip any non-XML content before the `<?xml` declaration (junk metadata fix)
- Check for truncated file by verifying the root element closes properly

**2. `src/lib/i18n.ts`** — Add translation keys:
- `pl.xmlIncomplete`: "Plik z planem lekcji jest niekompletny — brakuje sekcji z przypisaniami godzin (cards). Wyeksportuj pełny plik z aSc Timetables."
- `en.xmlIncomplete`: "The schedule file is incomplete — missing the cards section with time assignments. Export a full file from aSc Timetables."

**3. `src/pages/ClassSelector.tsx`** — Show error alert if XML loading fails, catching the specific incomplete error and displaying the translated message instead of an empty class list.

**4. `src/pages/Index.tsx`** and other pages loading lessons — Catch XML errors and display the validation message using an `Alert` component.

### Summary
The parser will validate the XML structure early, provide a clear error type, and all consuming pages will catch and display a human-readable message explaining what's wrong and how to fix it.

