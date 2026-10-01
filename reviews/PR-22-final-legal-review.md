# Final legal review — PR #22

**Scope:** FC 1.2 / CH 1.1 / CO 1.1 draft amendment package

**Baseline:** `main@438927bf503021aa1d46392bb25e1b96f304f0d2`

**Review result:** No Critical or Important legal-architecture defect found in the three-file draft package.

## Checks performed

- Existing registered/public texts are not rewritten.
- All three new files are explicitly marked draft, unregistered and non-effective.
- FC preserves the already-established separation between publication order and legal rank.
- CH is treated as foundational/value/interpretive rather than an independent coercive source.
- CO remains the superior binding structural instrument under FC.
- Subject-matter laws remain peer laws within their competences.
- EX, POL, REG, REF and STD cannot create authority beyond a valid legal source.
- REF is expressly non-legislative; POL requires valid delegation.
- The High Interpretation Authority is barred from hidden lawmaking.
- Location hierarchy and governance hierarchy are explicitly separated in CO.
- Constitutional violation/remedy provisions do not substitute for subject-law offense definitions or JUD procedure.
- Historical-version inconsistencies are recorded for later consolidation rather than silently rewriting historical releases.

## Minor observations for later consolidation

1. Identifier families for dependent documents should be rendered contextually (for example `ECON-REF-01`, `ECON-POL-01`) even though FC uses the generic type labels `REF` and `POL`.
2. When a consolidated FC 1.2 / CH 1.1 / CO 1.1 package is generated, the amendment text should be merged through the repository’s registered source/consolidation workflow rather than by overwriting historical releases.
3. Registry and manifest promotion remains a separate publication/legal-effect decision and is intentionally outside this PR.

**Disposition:** Package A is suitable to remain as a Draft PR while downstream package B is prepared. No merge recommendation is made here; merge/publication remains an explicit later decision.
