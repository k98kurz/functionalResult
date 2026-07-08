# Memory

## Test tag convention (v0.0.1)

**Decision:** Adopted single-letter test tags to identify which block a test
belongs to.

### Why

Test tags like `[P05]` are the stable anchor for locating tests — they appear in
error messages, bug reports, and CI output even as test names or `describe`
blocks are renamed.

### The scheme

| Block | Prefix | Tag range | Note |
|-------|--------|-----------|------|
| Constructors & Type Guards | **B** | B01–B06 | **B**asics — fundamental building blocks |
| Error Handling | **E** | E01–E09 | — |
| Transformations | **T** | T01–T07 | — |
| Composition | **P** | P01–P09 | **P**ipe is the headline feature of this block |
| Collections | **L** | L01–L08 | **L**ists / coL**L**ections |
| Validation | **V** | V01–V02 | — |
| Accessors | **A** | A01–A02 | `getOrElse`, `getOrThrow` — renamed from "Extraction" |
| Edge Cases | **X** | X01–X04 | **X** for eXtreme / eXceptional |
| Skill Export | **S** | S01–S07 | **S**kill export CLI tests |

### Criteria

- **Unique:** No collisions between prefixes
- **Stable:** Prefix remains meaningful if a block is renamed later
- **Mnemonic:** Prefix hints at the block content
- **Compact:** Single letter for easy scanning
- **Orderable:** Numerical suffix pinpoints position within a block

### Future

If the library test suite grows sufficiently, two-letter prefixes (e.g., `CT`,
`EH`, `TR`, `CP`, `CL`, `VL`, `AC`, `EC`, `SE`) will scale without ambiguity.

## JSDoc formatting conventions

**Decision:** JSDoc lines should wrap at 80 characters (soft limit) and must not
exceed 85 characters (hard limit).

### Rules

- **Continuation indentation:** When `@param`, `@returns`, or other tag descriptions
  wrap to a new line, indent that line **2 extra spaces** after `* `.
- **No trailing periods:** Tag descriptions (`@param`, `@returns`, `@template`) are
  capitalized sentence fragments with no final `.`.
- **Code references:** Property names and types use backticks (`` ` ``) for proper
  rendering by JSDoc tooling.
- **`- ` separator:** Always use ` - ` between the parameter name and its description
  (e.g. `@param fn - Does something`).

### Why

Prettier does not enforce a line-length limit inside JSDoc, and its default output
(120+ chars) is unwieldy in terminal windows and side-by-side diffs. The 85-char
hard limit gives a small safety margin above the 80-char soft target so minor
overflow doesn't trigger rewrapping.

### Enforcement

Run `npm run check:jsdoc` (or `npm run lint`, which includes it) to verify
compliance. The script is in `scripts/check-jsdoc-lines.mjs`.
