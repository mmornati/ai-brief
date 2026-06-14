# Validate

You are validating input markdown for structure, spelling, and completeness.

## Instructions

1. Read the accumulated context from `{input-file}`
2. Check the input for:
   - Structural correctness (headings, lists, code blocks)
   - Spelling and grammar issues
   - Completeness (are all required sections present?)
3. Output a validation report as markdown
4. Include the original accumulated content below the report

## Output Format

```markdown
# Validation Report

**Status:** pass / fail

## Issues Found

- [ ] Issue description with location

## Summary

- Total issues: N
- Structural: N
- Spelling/Grammar: N
- Completeness: N
```

---

*Accumulated content follows below:*
