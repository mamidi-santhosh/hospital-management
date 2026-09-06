package com.hospital.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimiterConfig {

    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String userHeader = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userHeader != null && !userHeader.isEmpty()) {
                return Mono.just(userHeader);
            }
            return Mono.just(exchange.getRequest().getRemoteAddress() != null 
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress() 
                : "anonymous");
        };
    }
}
