import {
    ConditionalFieldProperty,
    FieldDefinition,
    RuleContextFieldDefinition,
} from "../models/field-definition";
import { FormFlowDefinition } from "../models/form-definition";
import { v4 as uuidv4 } from "uuid";
import { RuleHelper } from "../utility/rule-helper";
import { Draft, castDraft, produce } from "immer";
import { FieldRuleGroupDefinition } from "../models/group";
import { FieldHelper } from "../utility/field-helper";

export type RulesManagerState = {
    field: FieldDefinition | undefined;
    ruleType: ConditionalFieldProperty | undefined;
    isTest: boolean;
    rule: FieldRuleGroupDefinition | undefined;
};

export type RulesManagerHelpersResult = {
    form: FormFlowDefinition;
    state: RulesManagerState;
};

export const createFieldRuleWorkspaceHelpers = () => {
    const getRule = (
        field?: FieldDefinition,
        ruleType?: ConditionalFieldProperty,
    ) => (field && ruleType ? field[ruleType] : undefined);

    const createState = (params?: {
        field?: FieldDefinition;
        ruleType?: ConditionalFieldProperty;
        isTest?: boolean;
    }): RulesManagerState => {
        const field = params?.field;
        const ruleType = params?.ruleType;

        return {
            field,
            ruleType,
            isTest: params?.isTest ?? false,
            rule: getRule(field, ruleType),
        };
    };

    const createForm = (
        fields: FieldDefinition[],
        formId?: string,
        ruleContextFields?: RuleContextFieldDefinition[],
        metadata?: Record<string, any>,
    ): FormFlowDefinition => ({
        formId: formId ?? uuidv4(),
        fields,
        ruleContextFields,
        metadata,
    });

    const syncStateWithForm = (
        form: FormFlowDefinition,
        state: RulesManagerState,
    ): RulesManagerState => {
        if (!state.field) {
            return createState({
                field: undefined,
                ruleType: state.ruleType,
                isTest: state.isTest,
            });
        }

        const nextField = FieldHelper.getFieldById(form.fields, state.field.id);
        return createState({
            field: nextField,
            ruleType: state.ruleType,
            isTest: state.isTest,
        });
    };

    const updateForm = (
        form: FormFlowDefinition,
        state: RulesManagerState,
        recipe: (draft: Draft<FormFlowDefinition>) => void,
    ): RulesManagerHelpersResult => {
        const nextForm = produce(form, recipe);
        const nextState = syncStateWithForm(nextForm, state);

        return {
            form: nextForm,
            state: nextState,
        };
    };

    const updateField = (
        form: FormFlowDefinition,
        state: RulesManagerState,
        field: FieldDefinition,
    ): RulesManagerHelpersResult => {
        const fieldIndex = FieldHelper.getFieldIndex(form.fields, field.id);
        if (fieldIndex < 0) {
            return { form, state };
        }

        return updateForm(form, state, (draft) => {
            draft.fields[fieldIndex] = castDraft(field);
        });
    };

    const selectFieldRule = (
        form: FormFlowDefinition,
        state: RulesManagerState,
        fieldId: string,
        ruleType: ConditionalFieldProperty,
        deselect?: boolean,
    ): RulesManagerState => {
        const field = FieldHelper.getFieldById(form.fields, fieldId);
        if (!field) return state;

        if (
            deselect &&
            field.id === state.field?.id &&
            state.ruleType === ruleType
        ) {
            return deselectFieldRule();
        }

        return createState({
            field,
            ruleType,
            isTest: false,
        });
    };

    const selectFieldTest = (
        form: FormFlowDefinition,
        state: RulesManagerState,
        fieldId: string,
        deselect?: boolean,
    ): RulesManagerState => {
        const field = FieldHelper.getFieldById(form.fields, fieldId);
        if (!field) return state;

        if (deselect && field.id === state.field?.id && !state.ruleType) {
            return deselectFieldRule();
        }

        return createState({
            field,
            ruleType: undefined,
            isTest: true,
        });
    };

    const deselectFieldRule = (): RulesManagerState =>
        createState({
            field: undefined,
            ruleType: undefined,
            isTest: false,
        });

    const createRule = (
        form: FormFlowDefinition,
        state: RulesManagerState,
        field: FieldDefinition,
        ruleType: ConditionalFieldProperty,
    ): RulesManagerHelpersResult & { rule: FieldRuleGroupDefinition } => {
        const emptyGroup = RuleHelper.createGroup(ruleType);
        const emptyRule = RuleHelper.createRule(field);
        emptyGroup.rules.push(emptyRule);

        const updatedField = { ...field, [ruleType]: emptyGroup };
        const result = updateField(form, state, updatedField);

        return {
            ...result,
            rule: emptyGroup,
        };
    };

    const deleteRule = (
        form: FormFlowDefinition,
        state: RulesManagerState,
        fieldId: string,
        ruleType: ConditionalFieldProperty,
    ): RulesManagerHelpersResult => {
        const field = FieldHelper.getFieldById(form.fields, fieldId);
        if (!field) {
            return { form, state };
        }

        const updatedField = { ...field, [ruleType]: undefined };
        return updateField(form, state, updatedField);
    };

    return {
        createForm,
        createState,
        getRule,
        syncStateWithForm,
        updateForm,
        updateField,
        selectFieldRule,
        selectFieldTest,
        deselectFieldRule,
        createRule,
        deleteRule,
    };
};
