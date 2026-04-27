package com.example.smartworkflow.model.graph;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class PolicyGraph {
    private Map<String, Node> nodes;
    private List<Edge> edges;
}
