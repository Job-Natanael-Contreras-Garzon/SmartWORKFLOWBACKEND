package com.example.smartworkflow.model.graph;

import lombok.Data;

@Data
public class Node {
    private String id;
    private String type; // e.g., "START", "END", "TASK", "CONDITION"
    private String name;
    // Map<String, Object> data could be added here to hold custom properties
}
