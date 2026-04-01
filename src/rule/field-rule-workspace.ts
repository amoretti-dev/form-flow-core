import { ConditionalFieldProperty, FieldDefinition, RuleContextFieldDefinition } from "../models/field-definition";
import { FormFlowDefinition } from "../models/form-definition";
import { v4 as uuidv4 } from 'uuid';
import { RuleHelper } from "../utility/rule-helper";
import { Draft, castDraft, produce } from "immer";
import { FieldRuleGroupDefinition } from "../models/group";
import { FieldHelper } from "../utility/field-helper";

export type RulesManagerState<TFieldControlType extends string = never> = {
    field: FieldDefinition<TFieldControlType> | undefined;
    ruleType: ConditionalFieldProperty | undefined;
    isTest: boolean;
    rule: FieldRuleGroupDefinition | undefined;
}

export type RulesManagerHelpersResult<TFieldControlType extends string = never> = {
    form: FormFlowDefinition<TFieldControlType>;
    state: RulesManagerState<TFieldControlType>;
}

// export class RulesManager<TFieldControlType extends string = never>
//     extends StateClass<RulesManagerState<TFieldControlType>> {
//     [immerable] = true;

//     private _form: FormFlowDefinition<TFieldControlType>;
//     private _state: InternalRulesManagerState<TFieldControlType>;

//     getSnapshot = () => this.state;

//     get state() {
//         return this._state;
//     }

//     constructor(
//         fields: FieldDefinition<TFieldControlType>[],
//         formId?: string,
//         ruleContextFields?: RuleContextFieldDefinition<TFieldControlType>[],
//         metadata?: Record<string, any>,
//         field?: FieldDefinition<TFieldControlType>,
//         ruleType?: ConditionalFieldProperty,
//         isTest: boolean = false
//     ) {
//         super()
//         this._form = { formId: formId ?? uuidv4(), ruleContextFields, fields, metadata }
//         const rule = field && ruleType ? field[ruleType] : undefined;
//         this._state = {
//             field,
//             ruleType,
//             rule,
//             isTest
//         }
//     }

//     getFieldById = (fieldId: string) =>
//         this._form.fields.find((f) => f.id == fieldId);

//     getFieldIndex = (fieldId: string) =>
//         this._form.fields.findIndex((f) => f.id == fieldId);

//     updateField = (field: FieldDefinition<TFieldControlType>) => {
//         const fieldIndex = this.getFieldIndex(field.id);
//         if (fieldIndex < 0) return;

//         this.updateForm(prev => {
//             prev.fields[fieldIndex] = castDraft(field);
//         });
//     }

//     updateForm(recipe: (draft: Draft<FormFlowDefinition<TFieldControlType>>) => void) {
//         this._form = produce(this._form, recipe);
//         this._updateState((draft) => {
//             if (!draft.field) return;

//             draft.field = castDraft(this.getFieldById(draft.field.id));
//         }, false);
//         this.emit();
//     }

//     private _updateState(
//         recipe: (draft: Draft<InternalRulesManagerState<TFieldControlType>>) => void,
//         emit: boolean = true,
//     ) {
//         this._state = produce(this._state, draft => {
//             recipe(draft);
//             draft.rule = draft.field && draft.ruleType ? draft.field[draft.ruleType] : undefined;
//         });

//         if (emit) {
//             this.emit();
//         }
//     }

//     get form() { return this._form; }

//     /**
//      * Selects the given rule for the specified field.
//      *
//      * @param deselect - Defaults to `false`. When `true`, clicking the same rule on the same field
//      * deselects the current selection instead of selecting it again.
//     */
//     selectFieldRule = (fieldId: string, ruleType: ConditionalFieldProperty, deselect?: boolean) => {
//         const field = this.getFieldById(fieldId);
//         if (!field) return;

//         if (deselect && field.id === this._state.field?.id && this._state.ruleType === ruleType) {
//             this.deselectFieldRule();
//             return;
//         }

//         this._updateState(draft => {
//             draft.field = castDraft(field);
//             draft.ruleType = ruleType;
//             draft.isTest = false;
//         })
//     }

//     selectFieldTest = (fieldId: string, deselect?: boolean) => {
//         const field = this.getFieldById(fieldId);
//         if (!field) return;

//         if (deselect && field.id === this._state.field?.id && !this._state.ruleType) {
//             this.deselectFieldRule();
//             return;
//         }

//         this._updateState(draft => {
//             draft.field = castDraft(field);
//             draft.ruleType = undefined;
//             draft.isTest = true;
//         })
//     }

//     deselectFieldRule = () => {
//         this._updateState(draft => {
//             draft.field = undefined;
//             draft.ruleType = undefined;
//             draft.isTest = false;
//         })
//     }

//     createRule = (field: FieldDefinition<TFieldControlType>, ruleType: ConditionalFieldProperty) => {
//         const emptyGroup = RuleHelper.createGroup(ruleType);
//         const emptyRule = RuleHelper.createRule<TFieldControlType>(field);
//         emptyGroup.rules.push(emptyRule);

//         const updatedField = { ...field, [ruleType]: emptyGroup }
//         this.updateField(updatedField);
//         return emptyGroup;
//     }

//     deleteRule = (fieldId: string, ruleType: ConditionalFieldProperty) => {
//         const field = this.getFieldById(fieldId);
//         if (!field) return;

//         const updatedField = { ...field, [ruleType]: undefined }
//         this.updateField(updatedField);
//     }
// }

export const createFieldRuleWorkspaceHelpers = <TFieldControlType extends string = never>() => {
    const getRule = (
        field?: FieldDefinition<TFieldControlType>,
        ruleType?: ConditionalFieldProperty,
    ) => field && ruleType ? field[ruleType] : undefined;

    const createState = (params?: {
        field?: FieldDefinition<TFieldControlType>;
        ruleType?: ConditionalFieldProperty;
        isTest?: boolean;
    }): RulesManagerState<TFieldControlType> => {
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
        fields: FieldDefinition<TFieldControlType>[],
        formId?: string,
        ruleContextFields?: RuleContextFieldDefinition<TFieldControlType>[],
        metadata?: Record<string, any>,
    ): FormFlowDefinition<TFieldControlType> => ({
        formId: formId ?? uuidv4(),
        fields,
        ruleContextFields,
        metadata,
    });

    const syncStateWithForm = (
        form: FormFlowDefinition<TFieldControlType>,
        state: RulesManagerState<TFieldControlType>,
    ): RulesManagerState<TFieldControlType> => {
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
        form: FormFlowDefinition<TFieldControlType>,
        state: RulesManagerState<TFieldControlType>,
        recipe: (draft: Draft<FormFlowDefinition<TFieldControlType>>) => void,
    ): RulesManagerHelpersResult<TFieldControlType> => {
        const nextForm = produce(form, recipe);
        const nextState = syncStateWithForm(nextForm, state);

        return {
            form: nextForm,
            state: nextState,
        };
    };

    const updateField = (
        form: FormFlowDefinition<TFieldControlType>,
        state: RulesManagerState<TFieldControlType>,
        field: FieldDefinition<TFieldControlType>,
    ): RulesManagerHelpersResult<TFieldControlType> => {
        const fieldIndex = FieldHelper.getFieldIndex(form.fields, field.id);
        if (fieldIndex < 0) {
            return { form, state };
        }

        return updateForm(form, state, draft => {
            draft.fields[fieldIndex] = castDraft(field);
        });
    };

    const selectFieldRule = (
        form: FormFlowDefinition<TFieldControlType>,
        state: RulesManagerState<TFieldControlType>,
        fieldId: string,
        ruleType: ConditionalFieldProperty,
        deselect?: boolean,
    ): RulesManagerState<TFieldControlType> => {
        const field = FieldHelper.getFieldById(form.fields, fieldId);
        if (!field) return state;

        if (deselect && field.id === state.field?.id && state.ruleType === ruleType) {
            return deselectFieldRule();
        }

        return createState({
            field,
            ruleType,
            isTest: false,
        });
    };

    const selectFieldTest = (
        form: FormFlowDefinition<TFieldControlType>,
        state: RulesManagerState<TFieldControlType>,
        fieldId: string,
        deselect?: boolean,
    ): RulesManagerState<TFieldControlType> => {
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

    const deselectFieldRule = (): RulesManagerState<TFieldControlType> =>
        createState({
            field: undefined,
            ruleType: undefined,
            isTest: false,
        });

    const createRule = (
        form: FormFlowDefinition<TFieldControlType>,
        state: RulesManagerState<TFieldControlType>,
        field: FieldDefinition<TFieldControlType>,
        ruleType: ConditionalFieldProperty,
    ): RulesManagerHelpersResult<TFieldControlType> & { rule: FieldRuleGroupDefinition } => {
        const emptyGroup = RuleHelper.createGroup(ruleType);
        const emptyRule = RuleHelper.createRule<TFieldControlType>(field);
        emptyGroup.rules.push(emptyRule);

        const updatedField = { ...field, [ruleType]: emptyGroup };
        const result = updateField(form, state, updatedField);

        return {
            ...result,
            rule: emptyGroup,
        };
    };

    const deleteRule = (
        form: FormFlowDefinition<TFieldControlType>,
        state: RulesManagerState<TFieldControlType>,
        fieldId: string,
        ruleType: ConditionalFieldProperty,
    ): RulesManagerHelpersResult<TFieldControlType> => {
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
