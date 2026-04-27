package com.example.smartworkflow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Configura el broker en memoria prefijando las colas con /topic
        config.enableSimpleBroker("/topic");
        // Prefijo para enviar mensajes desde el cliente hacia el servidor (si fuera necesario)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint STOMP público (o verificado vía interceptor CORS si configuraste JWT WebSocket Interceptor)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // En prod ajustar por seguridad
                .withSockJS(); // Fallback para navegadores antiguos / entornos restrictivos
    }
}
