# Memory

## Test tag convention (v0.0.1)

**Decision:** Adopted single-letter test tags to identify which block a test belongs to.

### Why

Test tags like `[P05]` are the stable anchor for locating tests — they appear in error messages, bug reports, and CI output even as test names or `describe` blocks are renamed.

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

If the library test suite grows sufficiently, two-letter prefixes (e.g., `CT`, `EH`, `TR`, `CP`, `CL`, `VL`, `AC`, `EC`, `SE`) will scale without ambiguity.
