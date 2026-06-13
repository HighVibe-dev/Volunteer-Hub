package com.nayepankh.volunteerhub.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:#{null}}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        if (databaseUrl != null && !databaseUrl.isBlank()) {
            String jdbcUrl = toJdbcUrl(databaseUrl);
            config.setJdbcUrl(jdbcUrl);

            try {
                URI uri = new URI(databaseUrl.replace("postgresql://", "http://")
                                              .replace("postgres://", "http://"));
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    config.setUsername(userInfo.split(":")[0]);
                    config.setPassword(userInfo.split(":", 2)[1]);
                } else if (userInfo != null) {
                    config.setUsername(userInfo);
                }
            } catch (Exception e) {
                // fallback: let the URL embed credentials
            }
        } else {
            config.setJdbcUrl("jdbc:postgresql://localhost:5432/volunteerhub");
            config.setUsername("postgres");
            config.setPassword("postgres");
        }

        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(20000);
        config.setIdleTimeout(300000);
        config.setMaxLifetime(600000);

        return new HikariDataSource(config);
    }

    private String toJdbcUrl(String rawUrl) {
        if (rawUrl.startsWith("jdbc:")) {
            return rawUrl;
        }
        String withJdbc = "jdbc:" + rawUrl;

        try {
            URI uri = new URI(rawUrl.replace("postgresql://", "http://")
                                    .replace("postgres://", "http://"));
            String userInfo = uri.getUserInfo();
            String host = uri.getHost();
            int port = uri.getPort();
            String path = uri.getPath();
            String query = uri.getQuery();

            String portStr = port > 0 ? ":" + port : "";
            String queryStr = query != null ? "?" + query : "";
            String scheme = rawUrl.startsWith("postgres://") ? "postgresql" : "postgresql";

            String jdbcUrl = "jdbc:" + scheme + "://" + host + portStr + path + queryStr;
            return jdbcUrl;
        } catch (Exception e) {
            return withJdbc;
        }
    }
}
