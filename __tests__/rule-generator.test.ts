import type { FieldDefinition } from "../src/models/field-definition";
import type { FieldRuleGroupDefinition } from "../src/models/group";
import { RuleGenerator } from "../src/rule/generator";

const createGroup = (
  ruleType: FieldRuleGroupDefinition["ruleType"] = "visibleIf",
): FieldRuleGroupDefinition => ({
  groupId: `group-${ruleType}`,
  operator: "and",
  ruleType,
  rules: [
    {
      ruleId: `rule-${ruleType}`,
      conditionFieldId: "dependency",
      operator: "eq",
      value: "enabled",
    },
  ],
});

const createFields = (): FieldDefinition[] => [
  {
    id: "name",
    label: "Name",
    type: "text",
    visibleIf: createGroup("visibleIf"),
  },
  {
    id: "age",
    label: "Age",
    type: "number",
  },
];

describe("RuleGenerator", () => {
  it("selects a field rule and exposes it through currentRule", () => {
    const generator = new RuleGenerator(createFields());

    generator.selectFieldRule("name", "visibleIf");

    expect(generator.currentRule).toEqual({
      field: generator.form.fields[0],
      ruleType: "visibleIf",
      isTest: false,
      rule: generator.form.fields[0].visibleIf,
    });
  });

  it("deselects the current field rule when the same rule is selected with deselect=true", () => {
    const generator = new RuleGenerator(createFields());

    generator.selectFieldRule("name", "visibleIf");
    generator.selectFieldRule("name", "visibleIf", true);

    expect(generator.currentRule).toEqual({
      field: undefined,
      ruleType: undefined,
      isTest: false,
      rule: undefined,
    });
  });

  it("selects and deselects test mode for a field", () => {
    const generator = new RuleGenerator(createFields());

    generator.selectFieldTest("name");

    expect(generator.currentRule).toEqual({
      field: generator.form.fields[0],
      ruleType: undefined,
      isTest: true,
      rule: undefined,
    });

    generator.selectFieldTest("name", true);

    expect(generator.currentRule).toEqual({
      field: undefined,
      ruleType: undefined,
      isTest: false,
      rule: undefined,
    });
  });

  it("creates a new rule group on the target field", () => {
    const fields = createFields();
    const generator = new RuleGenerator(fields);

    const createdGroup = generator.createRule(fields[1], "requiredIf");

    expect(createdGroup).toMatchObject({
      operator: "and",
      ruleType: "requiredIf",
      rules: [
        {
          conditionFieldId: "age",
          operator: "eq",
          value: 0,
        },
      ],
    });
    expect(createdGroup?.groupId).toBeTruthy();
    expect(createdGroup?.rules[0]).toHaveProperty("ruleId");
    expect(generator.form.fields[1].requiredIf).toEqual(createdGroup);
  });

  it("deletes an existing rule group from the target field", () => {
    const generator = new RuleGenerator([
      {
        id: "email",
        label: "Email",
        type: "text",
        disabledIf: createGroup("disabledIf"),
      },
    ]);

    generator.deleteRule("email", "disabledIf");

    expect(generator.form.fields[0].disabledIf).toBeUndefined();
  });

  it("keeps the selected field in sync after updateField replaces the form state", () => {
    const generator = new RuleGenerator(createFields());
    const updatedGroup = createGroup("visibleIf");
    const updatedField: FieldDefinition = {
      ...generator.form.fields[0],
      label: "Full name",
      visibleIf: updatedGroup,
    };

    generator.selectFieldRule("name", "visibleIf");
    generator.updateField(updatedField);

    expect(generator.currentRule).toEqual({
      field: generator.form.fields[0],
      ruleType: "visibleIf",
      isTest: false,
      rule: updatedGroup,
    });
    expect(generator.currentRule.field?.label).toBe("Full name");
  });
});
