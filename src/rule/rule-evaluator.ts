import { FieldControlState, FieldDefinition, FormControlState } from '../models/field-definition';
import { DependencyGraph } from '../dependency-graph';
import jsonLogic, { RulesLogic } from 'json-logic-js';
import { RuleMapper } from '../utility/rule-mapper';

export class RuleEvaluator {

  static evaluate(rule: RulesLogic | undefined, data: Record<string, any>): boolean {
    if (!rule) return true; // Se la regola è indefinita, ritorna true (o false, a seconda della logica desiderata)
    try {
      // Valida la regola con jsonLogic, se non è valida, restituirà undefined
      const result = jsonLogic.apply(rule, data);
      return result !== undefined ? !!result : false;
    } catch (err) {
      console.warn('Rule evaluation error:', err);
      return false; // Restituisce false in caso di errore nell'applicazione della regola
    }
  }

  static evaluateField = (
    field: FieldDefinition,
    formData: Record<string, any>
  ): FieldControlState => {
    const visible = field.visibleIf
      ? this.evaluate(RuleMapper.mapGroupToEngine(field.visibleIf), formData)
      : true;
    const required = field.requiredIf
      ? this.evaluate(RuleMapper.mapGroupToEngine(field.requiredIf), formData)
      : false;
    const disabled = field.disabledIf
      ? this.evaluate(RuleMapper.mapGroupToEngine(field.disabledIf), formData)
      : false;
    const readonly = field.readonlyIf
      ? this.evaluate(RuleMapper.mapGroupToEngine(field.readonlyIf), formData)
      : false;

    return {
      visible,
      disabled,
      readonly,
      required
    }
  }

  static evaluateFields(
    fields: FieldDefinition[],
    formData: Record<string, any>,
  ): FormControlState {
    const evaluated: FormControlState = {};
    fields.forEach((field) => {
      evaluated[field.id] = this.evaluateField(field, formData);
    });
    return evaluated;
  }

  static evaluateDependentsFields(
    sourceFieldId: string,
    otherFields: FieldDefinition[],
    formData: Record<string, any>,
    dependencyGraph: DependencyGraph
  ): FormControlState {
    const affectedFieldIds = dependencyGraph.getDependentFields(sourceFieldId);

    return this.evaluateFields(otherFields.filter(field => affectedFieldIds.has(field.id)), formData);
  }

  static extractVarsFromRule(rule: RulesLogic): string[] {
    const vars: string[] = [];

    // Funzione ricorsiva che attraversa la regola JSON
    const walk = (r: any) => {
      if (typeof r !== 'object' || r === null) return;

      if (Array.isArray(r)) {
        // Se è un array, esplora ogni elemento
        r.forEach(walk);
      } else {
        for (const key in r) {
          if (key === 'var') {
            // Se trova una variabile 'var', la aggiunge all'elenco
            if (typeof r[key] === 'string') {
              vars.push(r[key]);
            } else if (Array.isArray(r[key]) && typeof r[key][0] === 'string') {
              vars.push(r[key][0]);
            }
          } else {
            // Se la chiave non è 'var', continua a esplorare il valore
            walk(r[key]);
          }
        }
      }
    };

    // Iniziamo l'esplorazione dalla regola
    walk(rule);
    return vars;
  }
}