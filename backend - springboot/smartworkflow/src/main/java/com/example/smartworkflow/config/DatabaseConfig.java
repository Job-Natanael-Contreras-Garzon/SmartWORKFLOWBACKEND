package com.example.smartworkflow.config;

import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class DatabaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);
    private final DataSource dataSource;

    public DatabaseConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void testDatabaseConnection() {
        logger.info("Testing database connection on startup...");
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(5)) {
                logger.info("Successfully connected to the database: {}", connection.getMetaData().getURL());
            } else {
                logger.error("Failed to validate database connection.");
                throw new RuntimeException("Database connection validation failed.");
            }
        } catch (SQLException e) {
            logger.error("Error securing database connection on startup: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to connect to the database on startup.", e);
        }
    }
}
