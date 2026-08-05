import {
  createRuleBuilderHelpers,
  FormFlowRuleEvaluator,
  type FieldDefinition,
} from "../src/index";

describe("createRuleBuilderHelpers", () => {
  it("creates a domain rule tree with sensible defaults", () => {
    const helpers = createRuleBuilderHelpers();
    const state = helpers.createState({ ruleType: "visibleIf" });

    const { rule, state: nextState } = helpers.addRule(
      { id: "age", label: "Age", type: "number" },
      state,
      state.rootGroup.groupId!,
    );

    expect(rule).toEqual({
      ruleId: expect.any(String),
      conditionFieldId: "age",
      operator: "eq",
      value: 0,
    });

    expect(nextState.rootGroup).toEqual({
      groupId: state.rootGroup.groupId,
      operator: "and",
      ruleType: "visibleIf",
      rules: [rule],
    });
  });

  it("builds nested groups that can be evaluated by the existing engine", () => {
    const helpers = createRuleBuilderHelpers();
    let state = helpers.createState({ ruleType: "visibleIf" });

    const { group: nestedGroup, state: withGroup } = helpers.addGroup(
      "visibleIf",
      state,
      state.rootGroup.groupId!,
    );
    state = withGroup;

    const withStatusRule = helpers.addGroupOrRule(
      state,
      nestedGroup.groupId!,
      {
        ruleId: "status-rule",
        conditionFieldId: "status",
        operator: "eq",
        value: "inactive",
      },
    );
    state = withStatusRule.state;

    const { rule: ageRule, state: withAgeRule } = helpers.addRule(
      { id: "age", label: "Age", type: "number" },
      state,
      state.rootGroup.groupId!,
    );
    state = withAgeRule;

    const { rootGroup: rootGroupWithAgeRule } = helpers.updateRule(
      state,
      state.rootGroup.groupId!,
      { ...ageRule, operator: "gte", value: 18 },
    );
    state = helpers.createState({
      rootGroup: rootGroupWithAgeRule,
      ruleType: rootGroupWithAgeRule.ruleType,
    });

    const { state: withNot } = helpers.updateGroupNot(
      state,
      nestedGroup.groupId!,
      true,
    );
    state = withNot;

    const { rootGroup } = helpers.updateRootGroupRuleType(state, "disabledIf");

    const field: FieldDefinition = {
      id: "consent",
      label: "Consent",
      type: "checkbox",
      disabledIf: rootGroup,
    };

    const evaluated = FormFlowRuleEvaluator.evaluateField(field, {
      age: 18,
      status: "active",
    });

    expect(evaluated.disabled).toBe(true);
  });
});
