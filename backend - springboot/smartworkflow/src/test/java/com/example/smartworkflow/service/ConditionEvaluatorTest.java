package com.example.smartworkflow.service;

import org.junit.jupiter.api.Test;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ConditionEvaluatorTest {

    private final ConditionEvaluator conditionEvaluator = new ConditionEvaluator();

    @Test
    void shouldEvaluateTrueWhenExpressionIsNull() {
        assertTrue(conditionEvaluator.evaluate(null, new HashMap<>()));
    }

    @Test
    void shouldEvaluateTrueWhenExpressionIsEmpty() {
        assertTrue(conditionEvaluator.evaluate("   ", new HashMap<>()));
    }

    @Test
    void shouldEvaluateSimpleBooleanExpression() {
        Map<String, Object> variables = new HashMap<>();
        variables.put("aprobado", true);

        assertTrue(conditionEvaluator.evaluate("aprobado == true", variables));
        assertFalse(conditionEvaluator.evaluate("aprobado == false", variables));
    }

    @Test
    void shouldEvaluateNumericExpressions() {
        Map<String, Object> variables = new HashMap<>();
        variables.put("monto", 5000);

        assertTrue(conditionEvaluator.evaluate("monto > 1000", variables));
        assertFalse(conditionEvaluator.evaluate("monto > 10000", variables));
    }

    @Test
    void shouldEvaluateStringExpressions() {
        Map<String, Object> variables = new HashMap<>();
        variables.put("departamento", "RRHH");

        assertTrue(conditionEvaluator.evaluate("departamento == 'RRHH'", variables));
        assertFalse(conditionEvaluator.evaluate("departamento == 'IT'", variables));
    }

    @Test
    void shouldThrowExceptionWhenExpressionIsInvalid() {
        Map<String, Object> variables = new HashMap<>();

        Exception ex = assertThrows(IllegalArgumentException.class, () -> {
            conditionEvaluator.evaluate("abc === !!!", variables);
        });
        assertTrue(ex.getMessage().contains("Error al evaluar la expresión de condición"));
    }
}
