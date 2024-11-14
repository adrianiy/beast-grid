import { Formula, MathCell, MathErrors, MathType, Operand, Operation } from "../common";

// Operation order followin PEMDAS

const OPERATION_PRIORITY = {
    [Operation.POWER]: 4,
    [Operation.MULTIPLY]: 3,
    [Operation.DIVIDE]: 3,
    [Operation.ADD]: 2,
    [Operation.SUBTRACT]: 2,
}

export const parseFormula = (formula: string) => {
    const formulaParts = formula.match(/#{(.*)}/);

    if (!formulaParts) {
        return null;
    }
    const formulaString = formulaParts[1];

    return formulaToJSON(formulaString);
}

const getOperation = (formula: string): Operation => {
    const operation = formula.match(/(\+|-|\*|\^|\/)/);
    console.log(operation)

    if (!operation) {
        throw new Error(MathErrors.INVALID_FORMULA);
    }

    switch (operation[1]) {
        case '+':
            return Operation.ADD;
        case '-':
            return Operation.SUBTRACT;
        case '*':
            return Operation.MULTIPLY;
        case '/':
            return Operation.DIVIDE;
        case '^':
            return Operation.POWER;
    }

    throw new Error(MathErrors.INVALID_FORMULA);
}

const getOperand = (formula: string): MathCell => {
    const operand = formula.match(/(\S+)/);

    if (operand) {
        formula = formula.replace(operand[1], '');

        return {
            type: MathType.CELL,
            cell: operand[1]
        }
    }

    throw new Error(MathErrors.INVALID_FORMULA);
}

export const formulaToJSON = (formula: string, prevOperation?: Operation): Formula => {
    const parentesis = formula.match(/\((.*)\)/);
    const JSONFormula: Formula = {
        left: null,
        right: null,
        operation: null,
        type: MathType.OPERATION
    }

    let leftOperand: Operand;
    let rightOperand: Operand | null;

    if (parentesis) {
        leftOperand = formulaToJSON(parentesis[1]);

        formula = formula.replace(`(${parentesis[1]})`, '').trim();
    } else {
        leftOperand = getOperand(formula);

        formula = formula.replace(leftOperand.cell, '').trim();
    }

    if (!formula.length) {
        throw new Error(MathErrors.END_OF_FORMULA);
    }

    let operation = getOperation(formula);

    formula = formula.replace(operation, '').trim();

    while (operation) {
        if (prevOperation && operation && prevOperation !== operation) {
            if (OPERATION_PRIORITY[prevOperation] > OPERATION_PRIORITY[operation]) {
                throw new Error(MathErrors.LESS_PRIORITY);
            }
        }

        try {
            rightOperand = formulaToJSON(formula, operation);

            formula = '';
        } catch (e: unknown) {
            if ((e instanceof Error) && [MathErrors.LESS_PRIORITY, MathErrors.END_OF_FORMULA].includes(e.message as MathErrors)) {
                rightOperand = getOperand(formula);

                formula = formula.replace(rightOperand?.cell, '').trim();
            } else {
                throw e;
            }
        }


        JSONFormula.right = rightOperand;
        JSONFormula.left = leftOperand;
        JSONFormula.operation = operation;

        if (formula.length) {
            operation = getOperation(formula);

            formula = formula.replace(operation, '').trim();

            if (operation) {
                leftOperand = { ...JSONFormula };
                JSONFormula.right = null;
                JSONFormula.operation = null;
            }
        } else {
            break;
        }

    }

    return JSONFormula;
}
