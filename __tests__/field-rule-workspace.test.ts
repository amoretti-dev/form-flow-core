import type { FieldDefinition } from "../src/models/field-definition";
import type { FieldRuleGroupDefinition } from "../src/models/group";
import type { FormFlowDefinition } from "../src/models/form-definition";
import { createFieldRuleWorkspaceHelpers } from "../src/rule/field-rule-workspace";

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

const helpers = createFieldRuleWorkspaceHelpers();

const createFormAndState = (fields: FieldDefinition[]) => {
  const form: FormFlowDefinition = helpers.createForm(fields);
  const state = helpers.createState();
  return { form, state };
};

describe("createFieldRuleWorkspaceHelpers", () => {
  it("selects a field rule and exposes it through state.rule", () => {
    const { form, state } = createFormAndState(createFields());

    const nextState = helpers.selectFieldRule(form, state, "name", "visibleIf");

    expect(nextState).toEqual({
      field: form.fields[0],
      ruleType: "visibleIf",
      isTest: false,
      rule: form.fields[0].visibleIf,
    });
  });

  it("deselects the current field rule when the same rule is selected with deselect=true", () => {
    const { form, state } = createFormAndState(createFields());

    const selected = helpers.selectFieldRule(form, state, "name", "visibleIf");
    const deselected = helpers.selectFieldRule(
      form,
      selected,
      "name",
      "visibleIf",
      true,
    );

    expect(deselected).toEqual({
      field: undefined,
      ruleType: undefined,
      isTest: false,
      rule: undefined,
    });
  });

  it("selects and deselects test mode for a field", () => {
    const { form, state } = createFormAndState(createFields());

    const testSelected = helpers.selectFieldTest(form, state, "name");

    expect(testSelected).toEqual({
      field: form.fields[0],
      ruleType: undefined,
      isTest: true,
      rule: undefined,
    });

    const testDeselected = helpers.selectFieldTest(
      form,
      testSelected,
      "name",
      true,
    );

    expect(testDeselected).toEqual({
      field: undefined,
      ruleType: undefined,
      isTest: false,
      rule: undefined,
    });
  });

  it("creates a new rule group on the target field", () => {
    const { form, state } = createFormAndState(createFields());

    const { form: nextForm, rule: createdGroup } = helpers.createRule(
      form,
      state,
      form.fields[1],
      "requiredIf",
    );

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
    expect(createdGroup.groupId).toBeTruthy();
    expect(createdGroup.rules[0]).toHaveProperty("ruleId");
    expect(nextForm.fields[1].requiredIf).toEqual(createdGroup);
  });

  it("deletes an existing rule group from the target field", () => {
    const { form, state } = createFormAndState([
      {
        id: "email",
        label: "Email",
        type: "text",
        disabledIf: createGroup("disabledIf"),
      },
    ]);

    const { form: nextForm } = helpers.deleteRule(
      form,
      state,
      "email",
      "disabledIf",
    );

    expect(nextForm.fields[0].disabledIf).toBeUndefined();
  });

  it("keeps the selected field in sync after updateField replaces the form state", () => {
    const { form, state } = createFormAndState(createFields());
    const updatedGroup = createGroup("visibleIf");
    const updatedField: FieldDefinition = {
      ...form.fields[0],
      label: "Full name",
      visibleIf: updatedGroup,
    };

    const selected = helpers.selectFieldRule(form, state, "name", "visibleIf");
    const { form: updatedForm, state: syncedState } = helpers.updateField(
      form,
      selected,
      updatedField,
    );

    expect(syncedState).toEqual({
      field: updatedForm.fields[0],
      ruleType: "visibleIf",
      isTest: false,
      rule: updatedGroup,
    });
    expect(syncedState.field?.label).toBe("Full name");
  });
});
