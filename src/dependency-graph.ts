import { FieldDefinition, RuleContextFieldDefinition } from './models/field-definition';
import { FormFlowDefinition } from './models/form-definition';
import { FieldRuleNode } from './models/group';
import { RuleHelper } from './utility/rule-helper';

export class DependencyGraph {
    private dependentsMap: Map<string, Set<string>> = new Map();

    constructor(definition: FormFlowDefinition);
    constructor(fields: FieldDefinition[], ruleContextFields?: RuleContextFieldDefinition[]);
    constructor(
        definitionOrFields: FormFlowDefinition | FieldDefinition[],
        ruleContextFields: RuleContextFieldDefinition[] = []
    ) {
        const fields = Array.isArray(definitionOrFields)
            ? definitionOrFields
            : definitionOrFields.fields;
        const contextFields = Array.isArray(definitionOrFields)
            ? ruleContextFields
            : definitionOrFields.ruleContextFields ?? [];

        contextFields.forEach((field) => {
            if (!this.dependentsMap.has(field.id)) {
                this.dependentsMap.set(field.id, new Set());
            }
        });

        fields.forEach(field => {
            const dependencies = new Set<string>();

            // Estrazione delle dipendenze dalle regole
            const fieldRules = ['visibleIf', 'requiredIf', 'disabledIf', 'readonlyIf'];
            fieldRules.forEach(ruleName => {
                const rule = field[ruleName as keyof FieldDefinition];

                if (rule) {
                    this.extractDependencies(rule, dependencies);
                }
            });

            // Registriamo le dipendenze
            dependencies.forEach(dep => {
                if (!this.dependentsMap.has(dep)) {
                    this.dependentsMap.set(dep, new Set());
                }
                this.dependentsMap.get(dep)!.add(field.id);
            });
        });
    }

    /**
     * Estrae le dipendenze ricorsivamente da una regola, che può essere un FieldRuleDefinition o un FieldRuleGroupDefinition.
     */
    private extractDependencies(rule: FieldRuleNode, dependencies: Set<string>): void {
        if ('conditionFieldId' in rule) {
            // Se è una FieldRuleDefinition, aggiungi il conditionFieldId
            dependencies.add(rule.conditionFieldId);
        }

        if ('rules' in rule) {
            // Se è un FieldRuleGroupDefinition, esploriamo ricorsivamente le regole
            const groups = RuleHelper.getGroups(rule);
            const rules = RuleHelper.getRules(rule);

            // Esplora i gruppi
            groups.forEach(group => {
                this.extractDependencies(group, dependencies);
            });

            // Esplora le regole singole
            rules.forEach(r => {
                this.extractDependencies(r, dependencies);
            });
        }
    }

    /**
     * Restituisce tutti i campi che dipendono da un campo specifico.
     */
    getDependentFields(fieldId: string): Set<string> {
        const visited = new Set<string>();
        const stack = [fieldId];

        while (stack.length > 0) {
            const current = stack.pop()!;
            const dependents = this.dependentsMap.get(current) ?? new Set();
            for (const dep of dependents) {
                if (!visited.has(dep)) {
                    visited.add(dep);
                    stack.push(dep);
                }
            }
        }

        return visited;
    }
}
