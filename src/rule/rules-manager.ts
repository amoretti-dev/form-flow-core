import { ConditionalFieldProperty, FieldDefinition, RuleContextFieldDefinition } from "@/models/field-definition";
import { FormFlowDefinition } from "@/models/form-definition";
import { v4 as uuidv4 } from 'uuid';
import { RuleHelper } from "@/utility/rule-helper";
import { immerable, produce } from "immer";

export class RulesManager<TFieldControlType extends string = never> {
    [immerable] = true;

    private _form: FormFlowDefinition<TFieldControlType>;
    private _selectedField: FieldDefinition<TFieldControlType> | undefined;
    private _selectedRuleType: ConditionalFieldProperty | undefined;
    private _isTest: boolean = false;
    private get _selectedRule() {
        return this._selectedField && this._selectedRuleType ? this._selectedField[this._selectedRuleType] : undefined
    }

    get currentRule() {
        return {
            field: this._selectedField,
            ruleType: this._selectedRuleType,
            isTest: this._isTest,
            rule: this._selectedRule
        }
    }

    constructor(
        fields: FieldDefinition<TFieldControlType>[],
        formId?: string,
        ruleContextFields?: RuleContextFieldDefinition<TFieldControlType>[],
        metadata?: Record<string, any>) {
        this._form = { formId: formId ?? uuidv4(), ruleContextFields, fields, metadata }
    }

    getFieldById = (fieldId: string) =>
        this._form.fields.find((f) => f.id == fieldId);
    
    getFieldIndex = (fieldId: string) =>
        this._form.fields.findIndex((f) => f.id == fieldId);

    updateField = (field: FieldDefinition<TFieldControlType>) => {
        const fieldIndex = this.getFieldIndex(field.id);
        if (fieldIndex < 0) return;

        this.updateForm(prev => {
            prev.fields[fieldIndex] = field;
        });
    }

    updateForm(recipe: (draft: FormFlowDefinition<TFieldControlType>) => void) {
        this._form = produce(this._form, recipe);

        if (this._selectedField) {
            this._selectedField = this.getFieldById(this._selectedField.id);
        }
    }

    get form() { return this._form; }

    /**
     * Selects the given rule for the specified field.
     *
     * @param deselect - Defaults to `false`. When `true`, clicking the same rule on the same field
     * deselects the current selection instead of selecting it again.
    */
    selectFieldRule = (fieldId: string, ruleType: ConditionalFieldProperty, deselect?: boolean) => {
        const field = this.getFieldById(fieldId);
        if (!field) return;

        if (deselect && field.id === this._selectedField?.id && this._selectedRuleType === ruleType) {
            this.deselectFieldRule();
            return;
        }

        this._selectedField = field;
        this._selectedRuleType = ruleType;
        this._isTest = false;
    }

    selectFieldTest = (fieldId: string, deselect?: boolean) => {
        const field = this.getFieldById(fieldId);
        if (!field) return;

        if (deselect && field.id === this._selectedField?.id && !this._selectedRuleType) {
            this.deselectFieldRule();
            return;
        }

        this._selectedField = field;
        this._selectedRuleType = undefined;
        this._isTest = true;
    }

    deselectFieldRule = () => {
        this._selectedField = undefined;
        this._selectedRuleType = undefined;
        this._isTest = false;
    }

    createRule = (field: FieldDefinition<TFieldControlType>, ruleType: ConditionalFieldProperty) => {
        const emptyGroup = RuleHelper.createGroup(ruleType);
        const emptyRule = RuleHelper.createRule<TFieldControlType>(field);
        emptyGroup.rules.push(emptyRule);

        const updatedField = { ...field, [ruleType]: emptyGroup }
        this.updateField(updatedField);
        return emptyGroup;
    }

    deleteRule = (fieldId: string, ruleType: ConditionalFieldProperty) => {
        const field = this.getFieldById(fieldId);
        if (!field) return;

        const updatedField = { ...field, [ruleType]: undefined }
        this.updateField(updatedField);
    }
}

