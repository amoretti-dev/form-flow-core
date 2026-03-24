import {
  FormFlowRuleBuilder,
  FormFlowRuleEvaluator,
  type FieldDefinition,
} from "../src/index";

const createIdFactory = () => {
  let nextId = 0;

  return (kind: "group" | "rule") => `${kind}-${++nextId}`;
};

describe("FormFlowRuleBuilder", () => {
  it("creates a domain rule tree with sensible defaults", () => {
    const builder = new FormFlowRuleBuilder({
      ruleType: "visibleIf",
      createId: createIdFactory(),
    });

    const rule = builder.addRule({
      id: "age",
      label: "Age",
      type: "number",
    });

    expect(rule).toEqual({
      ruleId: "rule-1",
      conditionFieldId: "age",
      operator: "eq",
      value: 0,
    });

    expect(builder.build()).toEqual({
      groupId: "root",
      operator: "and",
      ruleType: "visibleIf",
      rules: [rule],
    });
  });

  it("builds nested groups that can be evaluated by the existing engine", () => {
    const builder = new FormFlowRuleBuilder({
      ruleType: "visibleIf",
      createId: createIdFactory(),
    });

    const nestedGroup = builder.addGroup({ operator: "or", not: true });
    builder.addRule(
      { id: "status", label: "Status", type: "text" },
      {
        parentGroupId: nestedGroup.groupId,
        operator: "eq",
        value: "inactive",
      },
    );
    builder.addRule(
      { id: "age", label: "Age", type: "number" },
      {
        operator: "gte",
        value: 18,
      },
    );
    builder.setRuleType("disabledIf");

    const field: FieldDefinition = {
      id: "consent",
      label: "Consent",
      type: "checkbox",
      disabledIf: builder.build(),
    };

    const evaluated = FormFlowRuleEvaluator.evaluateField(field, {
      age: 18,
      status: "active",
    });

    expect(field.disabledIf).toEqual({
      groupId: "root",
      operator: "and",
      ruleType: "disabledIf",
      rules: [
        {
          groupId: "group-1",
          operator: "or",
          ruleType: "disabledIf",
          not: true,
          rules: [
            {
              ruleId: "rule-2",
              conditionFieldId: "status",
              operator: "eq",
              value: "inactive",
            },
          ],
        },
        {
          ruleId: "rule-3",
          conditionFieldId: "age",
          operator: "gte",
          value: 18,
        },
      ],
    });
    expect(evaluated.disabled).toBe(true);
  });
});
