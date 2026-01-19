import { FieldRuleGroupDefinition, FieldRuleNode } from "../models/group";
import { FieldRuleDefinition } from "../models/rule";

export class RuleHelper {
    // Funzione privata per verificare se l'elemento è un gruppo
    static isGroup(rule: FieldRuleNode): rule is FieldRuleGroupDefinition {
        return (rule as FieldRuleGroupDefinition).rules !== undefined;
    }

    static getGroups(group: FieldRuleGroupDefinition): FieldRuleGroupDefinition[] {
        return group.rules.filter(r => this.isGroup(r)) as FieldRuleGroupDefinition[];
    }

    static getRules(group: FieldRuleGroupDefinition): FieldRuleDefinition[] {
        return group.rules.filter(r => !this.isGroup(r)) as FieldRuleDefinition[];
    }

    static findGroup(groupId: string, group: FieldRuleGroupDefinition): FieldRuleGroupDefinition | undefined {
        if (group.groupId === groupId) return group;

        for (const rule of group.rules) {
            if (this.isGroup(rule)) {
                const found = this.findGroup(groupId, rule);
                if (found) return found;
            }
        }

        return undefined;
    };

    static findRule(ruleId: string, group: FieldRuleGroupDefinition): FieldRuleDefinition | undefined {
        // Verifica se qualche regola di questo gruppo ha l'ID richiesto
        for (const rule of group.rules) {
            if (!this.isGroup(rule) && rule.ruleId === ruleId) {
                return rule;
            }

            // Se è un gruppo, eseguiamo la ricerca ricorsiva nelle sue regole
            if (this.isGroup(rule)) {
                const found = this.findRule(ruleId, rule);
                if (found) return found;
            }
        }

        return undefined;
    }
}