package com.example.smartworkflow.service;

import com.example.smartworkflow.model.graph.Edge;
import com.example.smartworkflow.model.graph.Node;
import com.example.smartworkflow.model.graph.PolicyGraph;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PolicyDeserializer {

    private final ObjectMapper objectMapper;

    public PolicyDeserializer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Convierte el JSON (diagram_json) a un grafo en memoria y valida su estructura básica.
     * @param diagramJson JSON en formato string
     * @return PolicyGraph instanciado y validado
     */
    public PolicyGraph deserializeAndValidate(String diagramJson) {
        try {
            PolicyGraph graph = objectMapper.readValue(diagramJson, PolicyGraph.class);
            validateGraph(graph);
            return graph;
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("El formato del JSON para el diagrama de la política es inválido", e);
        }
    }

    private void validateGraph(PolicyGraph graph) {
        if (graph.getNodes() == null || graph.getNodes().isEmpty()) {
            throw new IllegalArgumentException("El grafo debe contener al menos un nodo.");
        }

        String startNodeId = null;
        boolean hasEndNode = false;

        // Validar nodos requeridos (START y END)
        for (Map.Entry<String, Node> entry : graph.getNodes().entrySet()) {
            Node node = entry.getValue();
            if (node.getId() == null) {
                node.setId(entry.getKey()); // Aseguramos que el id esté en el nodo basándonos en la clave
            }
            
            if ("START".equalsIgnoreCase(node.getType())) {
                if (startNodeId != null) {
                    throw new IllegalArgumentException("El grafo solo puede tener un único nodo 'START'.");
                }
                startNodeId = entry.getKey();
            } else if ("END".equalsIgnoreCase(node.getType())) {
                hasEndNode = true;
            }
        }

        if (startNodeId == null) {
            throw new IllegalArgumentException("El grafo debe contener de forma obligatoria un nodo 'START'.");
        }
        if (!hasEndNode) {
            throw new IllegalArgumentException("El grafo debe contener al menos un nodo 'END'.");
        }

        // Construir lista de adyacencia y validar que los enlaces apunten a nodos válidos
        Map<String, List<String>> adjacencyList = new HashMap<>();
        if (graph.getEdges() != null) {
            for (Edge edge : graph.getEdges()) {
                if (!graph.getNodes().containsKey(edge.getSource()) || !graph.getNodes().containsKey(edge.getTarget())) {
                    throw new IllegalArgumentException(String.format("Enlace inválido. El nodo de origen (%s) o de destino (%s) no existe.", edge.getSource(), edge.getTarget()));
                }
                adjacencyList.computeIfAbsent(edge.getSource(), k -> new ArrayList<>()).add(edge.getTarget());
            }
        }

        // Verificar conectividad desde el nodo START (BFS)
        Set<String> visitedNodes = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        
        queue.add(startNodeId);
        visitedNodes.add(startNodeId);

        while (!queue.isEmpty()) {
            String current = queue.poll();
            List<String> neighbors = adjacencyList.getOrDefault(current, Collections.emptyList());
            
            for (String neighbor : neighbors) {
                if (!visitedNodes.contains(neighbor)) {
                    visitedNodes.add(neighbor);
                    queue.add(neighbor);
                }
            }
        }

        // Revisar que al menos un nodo END haya sido alcanzado exitosamente
        boolean reachedEnd = visitedNodes.stream()
                .anyMatch(nodeId -> "END".equalsIgnoreCase(graph.getNodes().get(nodeId).getType()));

        if (!reachedEnd) {
            throw new IllegalArgumentException("No hay un camino válido desde el nodo 'START' hasta un nodo 'END'.");
        }

        // Opcional: Impedir nodos aislados / no alcanzables
        if (visitedNodes.size() < graph.getNodes().size()) {
            throw new IllegalArgumentException("Existen nodos inalcanzables en el diagrama partiendo desde el flujo principal del nodo 'START'.");
        }
    }
}
