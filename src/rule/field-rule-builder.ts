import { FieldDefinition, ConditionalFieldProperty, RuleContextFieldDefinition } from "@/models/field-definition";
import { FieldRuleGroupDefinition, FieldRuleNode, LogicalOperator } from "@/models/group";
import { FieldRuleDefinition } from "@/models/rule";
import { immerable, produce } from "immer";
import { RuleHelper } from "@/utility/rule-helper";
import { StateClass } from "@/models/shared";

export type FieldRuleBuilderState<TFieldControlType extends string = never> = {
    rootGroup: FieldRuleGroupDefinition;
    rules: FieldRuleDefinition[];
    groups: FieldRuleGroupDefinition[];
}

export class FieldRuleBuilder<TFieldControlType extends string = never> extends StateClass<FieldRuleBuilderState<TFieldControlType>> {

    [immerable] = true;

    private _field: FieldDefinition<TFieldControlType>;
    private _ruleType: ConditionalFieldProperty;
    private _rootGroup: FieldRuleGroupDefinition;

    constructor(
        field: FieldDefinition<TFieldControlType>,
        ruleType: ConditionalFieldProperty = "visibleIf",
        rootGroup?: FieldRuleGroupDefinition,
    ) {
        super();
        this._field = field;
        this._ruleType = ruleType;
        this._rootGroup = rootGroup ?? RuleHelper.createGroup(ruleType);
    }

    getSnapshot(): FieldRuleBuilderState<TFieldControlType> {
        return {
            rootGroup: this._rootGroup,
            rules: this.rules,
            groups: this.groups
        }
    }
    get rules() { return RuleHelper.getRules(this._rootGroup) };
    get groups() { return RuleHelper.getGroups(this._rootGroup) };

    updateRootGroup(recipe: (draft: FieldRuleGroupDefinition) => void) {
        this._rootGroup = produce(this._rootGroup, recipe);
    }

    private findGroup(groupId: string, rootGroup: FieldRuleGroupDefinition = this._rootGroup) {
        return RuleHelper.findGroup(groupId, rootGroup);
    }

    private mutateGroup(groupId: string, recipe: (group: FieldRuleGroupDefinition) => void) {
        this.updateRootGroup((draft) => {
            const group = this.findGroup(groupId, draft);
            if (!group) return;

            recipe(group);
        });
    }

    private rewriteGroupRules(
        groupId: string,
        rewrite: (rules: FieldRuleNode[]) => FieldRuleNode[],
    ) {
        this.mutateGroup(groupId, (group) => {
            group.rules = rewrite(group.rules);
        });
    }

    private getGroupRules(groupId: string): FieldRuleNode[] {
        return this.findGroup(groupId)?.rules ?? [];
    }

    updateGroupAndNestedGroups = (group: FieldRuleGroupDefinition, newRuleType: ConditionalFieldProperty) => {
        // Aggiorna il gruppo corrente
        const updatedGroup = { ...group, ruleType: newRuleType };

        // Controlla se ci sono gruppi figli, e aggiorna anche loro
        const updatedRules: FieldRuleNode[] = updatedGroup.rules.map(rule => {
            if (RuleHelper.isGroup(rule)) {
                // Se la regola è un gruppo, applica ricorsivamente l'aggiornamento
                return this.updateGroupAndNestedGroups(rule, newRuleType);
            }
            return rule;
        });

        // Restituisci il gruppo aggiornato con le sue regole modificate
        return { ...updatedGroup, rules: updatedRules };
    }

    addRule(parentGroupId: string) {
        const newRule = RuleHelper.createRule(this._field);
        return this.addGroupOrRule(parentGroupId, newRule);
    };

    addGroup(parentGroupId: string) {
        const newGroup = RuleHelper.createGroup(this._ruleType);
        return this.addGroupOrRule(parentGroupId, newGroup);
    };

    addGroupOrRule(parentGroupId: string, groupOrRule: FieldRuleNode): FieldRuleNode[] {
        this.mutateGroup(parentGroupId, (group) => {
            group.rules.push(groupOrRule);
        });

        return this.getGroupRules(parentGroupId);
    };

    updateRule(parentGroupId: string, rule: FieldRuleDefinition): FieldRuleGroupDefinition {
        this.rewriteGroupRules(parentGroupId, (rules) =>
            rules.map((currentRule) =>
                RuleHelper.isGroup(currentRule) ? currentRule : currentRule.ruleId === rule.ruleId ? rule : currentRule
            )
        );

        return this._rootGroup;
    }

    removeGroup(parentGroupId: string, groupToRemove: FieldRuleGroupDefinition): FieldRuleNode[] {
        this.rewriteGroupRules(parentGroupId, (rules) =>
            rules.filter((rule) =>
                RuleHelper.isGroup(rule) ? rule.groupId !== groupToRemove.groupId : true
            )
        );

        return this.getGroupRules(parentGroupId);
    }

    removeRule(parentGroupId: string, ruleToRemove: FieldRuleDefinition) {
        this.rewriteGroupRules(parentGroupId, (rules) =>
            rules.filter((rule) =>
                RuleHelper.isGroup(rule) || rule.ruleId !== ruleToRemove.ruleId
            )
        );

        return this.getGroupRules(parentGroupId);
    }

    updateGroupOperator(groupId: string, operator: LogicalOperator) {
        this.mutateGroup(groupId, (group) => {
            group.operator = operator;
        });
    }

    updateGroupNot(groupId: string, not: boolean) {
        this.mutateGroup(groupId, (group) => {
            group.not = not;
        });
    }

    toggleGroupNot(groupId: string) {
        this.mutateGroup(groupId, (group) => {
            group.not = !group.not;
        });
    }

    updateRootGroupRuleType(newRuleType: ConditionalFieldProperty) {
        const updatedGroup = this.updateGroupAndNestedGroups(this._rootGroup, newRuleType);
        this.updateRootGroup((draft) => draft = updatedGroup);
        return updatedGroup;
    }

    updateRootGroupOperator(op: LogicalOperator) {
        this.updateRootGroup(draft => {
            draft.operator = op;
        });
    }

    toggleRootGroupNot(not?: boolean) {
        this.updateRootGroup(draft => {
            const notValue = not != undefined ? not : !draft.not;
            draft.not = notValue;
        });
    }
}
