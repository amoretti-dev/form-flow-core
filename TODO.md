# TODO

## Planned: fluent rule-builder DSL (purely additive, no breaking changes)

**Status: proposed, not started.** Recorded here so the design isn't re-derived from
scratch next time — see rationale below before changing the shape.

### Goal

A functional/composable API for constructing `FieldRuleGroupDefinition` /
`FieldRuleDefinition` trees by hand, for consumers who use `@form-flow/core`
directly and want to build rules programmatically instead of assembling the
raw objects themselves:

```ts
const rules1 = ruleBuilder.and(
  ruleBuilder.eq("field1", "pippo"),
  ruleBuilder.gte("field2", 20),
);
```

### Explicitly out of scope

- **Not** for the React rule-builder UI (`@form-flow/react`'s
  `RuleTreeEditor` / `FieldRuleWorkspace`). That UI has its own
  state-driven creation flow (`createFieldRuleWorkspaceHelpers` /
  `createRuleBuilderHelpers`) built around interactive editing, not
  expression construction — different concern, not something this DSL
  should try to also serve. It's a plain data-construction convenience for
  hand-written rules, nothing more.
- **No changes to `FieldRuleGroupDefinition` / `FieldRuleDefinition` / any
  existing exported type or function.** This ships as a new, standalone,
  additive module. Existing consumers see zero behavior change and zero
  new required imports.

### Design note: `ruleType` is required even on nested groups

`FieldRuleGroupDefinition.ruleType: ConditionalFieldProperty` is **not
optional** in the current model — every group carries it, including nested
ones used only for composition (e.g. the `or(...)` inside an outer
`and(...)`). In practice only the *root* group's `ruleType` is ever read:
`RuleMapper.extractRulesFromGroup` (and the evaluator generally) only look
at `operator` / `not` / `rules` on nested groups, never `ruleType`. It's a
model quirk from reusing one interface for both the root (which really
means something — "this tree implements `visibleIf`") and nested
composition groups (which don't).

Consequence for the DSL: `and(...)` / `or(...)` used for composition can't
know the "correct" `ruleType` at construction time, and picking a silent
default would hide that quirk instead of surfacing it. Planned handling:
build the tree without worrying about `ruleType` during composition, then
require one explicit step that stamps it — on the root **and** recursively
on every nested group — at the point the tree is attached to a field:

```ts
field.visibleIf = forRuleType("visibleIf", rules1);
```

If `FieldRuleGroupDefinition` is ever revisited to split "root group" from
"nested group" as distinct types (making `ruleType` root-only), this
whole `forRuleType` step becomes unnecessary — worth remembering as the
real fix if that refactor ever happens, but it's a breaking type change so
not part of this pass.

### Steps

- [ ] New standalone module, e.g. `src/rule/rule-builder-dsl.ts`. No
      changes to any existing file.
- [ ] Leaf builders mirroring `EngineRuleFactory.value`'s keys exactly (not
      inventing new names): `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`,
      `lengthEquals`, `isEmpty`, `isNotEmpty`, `isTrue`, `isFalse` (audit
      the full `RuleOperatorKey` union before implementing — some of these
      names are from memory, not re-verified against the current file).
      Each leaf builder returns a `FieldRuleDefinition` with a generated
      `ruleId` (reuse the existing id-generation helper already used by
      `RuleHelper.createRule`, don't add a second one).
- [ ] `and(...nodes)` / `or(...nodes)` accepting `FieldRuleNode[]` via rest
      args (leaves and/or nested groups — nesting is free, `rules:
      FieldRuleNode[]` already supports it). Generates a `groupId` the same
      way `RuleHelper.createGroup` does.
- [ ] `not(node)` — immutable, returns `{ ...node, not: true }`, works on
      both leaves and groups.
- [ ] `forRuleType(ruleType, rootGroup)` — the attach-time step described
      above. Recursively walks the tree and sets `ruleType` on the root and
      every nested group. Returns a new tree (immutable), doesn't mutate
      the input.
- [ ] Export everything from `src/index.ts` under a name that can't be
      confused with `createRuleBuilderHelpers` (the React-builder-facing
      state manager — same domain, different job). Candidate names:
      `ruleBuilder` (matches the usage sketch above) or `defineRule`.
      Pick one and stay consistent — don't ship both.
- [ ] Unit tests:
  - Each leaf builder produces a valid `FieldRuleDefinition` with the
    right `operator`/`conditionFieldId`/`value`.
  - `and`/`or` nest correctly (group-of-groups).
  - `not()` toggles correctly on both leaves and groups, doesn't mutate
    the input.
  - `forRuleType` stamps root **and** nested groups.
  - Round-trip: a DSL-built tree evaluates identically to the equivalent
    hand-written object through `FormFlowRuleEvaluator.evaluateFields` —
    this is the test that actually proves the DSL is a faithful shorthand,
    not just that it produces *some* object shape.
- [ ] README section with the DSL as an alternative to hand-assembling
  rule objects, explicitly scoped to `@form-flow/core`-only consumers (no
  mention of the React builder, to avoid the confusion this doc exists to
  prevent).
