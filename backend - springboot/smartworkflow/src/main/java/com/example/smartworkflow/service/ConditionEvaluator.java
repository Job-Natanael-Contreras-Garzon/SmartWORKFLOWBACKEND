package com.example.smartworkflow.service;

import org.springframework.context.expression.MapAccessor;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ConditionEvaluator {

    private final ExpressionParser parser = new SpelExpressionParser();

    /**
     * Evalúa una expresión condicional (por ejemplo de un GATEWAY XOR) usando 
     * Spring Expression Language (SpEL) contra las variables de contexto.
     * 
     * Implementa MapAccessor para permitir accesos directos a las propiedades
     * sin necesidad de prefijos, permitiendo usar "aprobado == true" directamente.
     * 
     * @param expression La expresión a evaluar, ej: "aprobado == true"
     * @param variables  El mapa de variables (form data acumulada) del caso
     * @return true si la condición se cumple, false en caso contrario
     */
    public boolean evaluate(String expression, Map<String, Object> variables) {
        if (expression == null || expression.trim().isEmpty()) {
            return true; // Si no hay expresión, por default tomamos la ruta como válida
        }

        // Seteamos el mapa directamente como objeto raíz del contexto y le
        // agregamos MapAccessor para poder evaluar llaves como propiedades.
        StandardEvaluationContext context = new StandardEvaluationContext(variables);
        context.addPropertyAccessor(new MapAccessor());

        try {
            Boolean result = parser.parseExpression(expression).getValue(context, Boolean.class);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            throw new IllegalArgumentException("Error al evaluar la expresión de condición: '" + expression + "' con los datos: " + variables, e);
        }
    }
}
