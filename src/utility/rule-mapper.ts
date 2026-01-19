import { RulesLogic } from "json-logic-js";
import { FieldRuleGroupDefinition } from "../models/group";
import { FieldRuleDefinition } from "../models/rule";
import { RuleHelper } from "./rule-helper";
import { RuleBuilder } from "../rule-builder";

export class RuleMapper {
  // Mappare il gruppo principale con tutte le regole e i gruppi annidati
  static mapGroupToEngine(group: FieldRuleGroupDefinition): RulesLogic {
    const groupedRules = this.extractRulesFromGroup(group);

    // Se il gruppo contiene solo una regola, la mappiamo direttamente
    if (groupedRules.length === 1) {
      return groupedRules[0];
    }

    // Se ci sono più regole, combiniamo con l'operatore AND/OR
    const engineGroup = RuleBuilder.group[group.operator];
    const engineRule = engineGroup(...groupedRules);

    if (group.not) {
      return RuleBuilder.group.not(engineRule);
    }

    return engineRule;
  };

  static mapGroupToCustom(
    group: FieldRuleGroupDefinition,
    callback: (group: FieldRuleGroupDefinition, mappedRules: RulesLogic[]) => RulesLogic
  ): RulesLogic {
    const groupedRules = this.extractRulesFromGroup(group);

    // Se il gruppo contiene solo una regola, la mappiamo direttamente
    if (groupedRules.length === 1) {
      return callback(group, groupedRules);
    }

    // Se ci sono più regole, combiniamo con l'operatore AND/OR
    const engineGroup = RuleBuilder.group[group.operator];
    const engineRule = engineGroup(...groupedRules);

    if (group.not) {
      return callback(group, [RuleBuilder.group.not(engineRule)]);
    }

    return callback(group, [engineRule]);
  }

  // Funzione privata per raccogliere le regole da un gruppo (incluso il supporto per gruppi annidati)
  private static extractRulesFromGroup(group: FieldRuleGroupDefinition): RulesLogic[] {
    return group.rules.reduce((acc: RulesLogic[], rule) => {
      // Se la regola è un gruppo annidato, applica ricorsivamente
      if (RuleHelper.isGroup(rule)) {
        acc.push(this.mapGroupToEngine(rule as FieldRuleGroupDefinition)); // Gruppo annidato
      }
      // Se è una regola normale e appartiene al gruppo, aggiungila
      else {
        acc.push(this.mapRuleToEngine(rule)); // Regola normale
      }
      return acc;
    }, []);
  }

  // Mappatura di una singola regola
  static mapRuleToEngine(rule: FieldRuleDefinition): RulesLogic {
    const engineRule = RuleBuilder.value[rule.operator];

    let logic: RulesLogic;
    if (rule.operator == "var") {
      const left = engineRule(rule.conditionFieldId, undefined);
      const right = engineRule(rule.value!, undefined);
      logic = { "==": [left, right] }
    } else {
      logic = engineRule(rule.conditionFieldId, rule.value);
    }

    if (rule.not) {
      return RuleBuilder.group.not(logic);
    }

    return logic;
  }

  // Mappatura di una singola regola con una funzione di callback
  static mapRuleToCustom(
    rule: FieldRuleDefinition,
    callback: (rule: FieldRuleDefinition, logic: RulesLogic) => RulesLogic
  ): RulesLogic {
    const engineRule = RuleBuilder.value[rule.operator];

    let logic: RulesLogic;
    if (rule.operator == "var") {
      const left = engineRule(rule.conditionFieldId, undefined);
      const right = engineRule(rule.value!, undefined);
      logic = { "==": [left, right] }
    } else {
      logic = engineRule(rule.conditionFieldId, rule.value);
    }

    if (rule.not) {
      logic = RuleBuilder.group.not(logic);
    }

    // Applica la callback per il formato personalizzato
    return callback(rule, logic);
  }
}