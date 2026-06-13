package com.nayepankh.volunteerhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class VolunteerHubApplication {
    public static void main(String[] args) {
        SpringApplication.run(VolunteerHubApplication.class, args);
    }
}
