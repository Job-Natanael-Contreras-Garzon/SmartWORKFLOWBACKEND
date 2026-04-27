package com.example.smartworkflow.model.graph;

import lombok.Data;

@Data
public class Edge {
    private String id;
    private String source;
    private String target;
    private String conditionExpression; // Para evaluar en un GATEWAY_XOR
}
