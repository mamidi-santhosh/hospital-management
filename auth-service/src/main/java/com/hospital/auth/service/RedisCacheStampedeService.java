package com.hospital.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisCacheStampedeService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Resolves cache stampede using Distributed Mutex Locking.
     * Prevents database dog-piling when cache key expires under high concurrency.
     */
    public <T> T getOrComputeWithLock(String cacheKey, String lockKey, Class<T> clazz, Duration ttl, Supplier<T> dbSupplier) {
        // Step 1: Check cache first
        String cachedJson = redisTemplate.opsForValue().get(cacheKey);
        if (cachedJson != null) {
            try {
                log.debug("Cache HIT for key: {}", cacheKey);
                return objectMapper.readValue(cachedJson, clazz);
            } catch (Exception e) {
                log.error("Failed to deserialize cached value for key: {}", cacheKey, e);
            }
        }

        // Step 2: Cache MISS - acquire distributed mutex lock
        String lockValue = UUID.randomUUID().toString();
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, lockValue, Duration.ofSeconds(5));

        if (Boolean.TRUE.equals(acquired)) {
            try {
                log.info("Cache MISS - Lock acquired for key: {}. Computing from Database.", cacheKey);
                T dbResult = dbSupplier.get();
                if (dbResult != null) {
                    String jsonToCache = objectMapper.writeValueAsString(dbResult);
                    redisTemplate.opsForValue().set(cacheKey, jsonToCache, ttl);
                }
                return dbResult;
            } catch (Exception e) {
                log.error("Error populating cache for key: {}", cacheKey, e);
                throw new RuntimeException("Cache computation failed", e);
            } finally {
                // Release lock safely
                String currentLockVal = redisTemplate.opsForValue().get(lockKey);
                if (lockValue.equals(currentLockVal)) {
                    redisTemplate.delete(lockKey);
                }
            }
        } else {
            // Step 3: Lock contention - spin wait briefly to let lock holder populate cache
            log.info("Cache MISS - Lock held by another request for key: {}. Waiting for cache population...", cacheKey);
            try {
                Thread.sleep(50);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
            // Retry reading from cache after waiting
            String retryCachedJson = redisTemplate.opsForValue().get(cacheKey);
            if (retryCachedJson != null) {
                try {
                    return objectMapper.readValue(retryCachedJson, clazz);
                } catch (Exception e) {
                    log.error("Failed to deserialize cached value on retry for key: {}", cacheKey, e);
                }
            }
            // Fallback directly to DB if still miss
            return dbSupplier.get();
        }
    }

    public void invalidateCache(String cacheKey) {
        redisTemplate.delete(cacheKey);
    }

    public void blacklistToken(String token, Duration duration) {
        redisTemplate.opsForValue().set("blacklist:" + token, "true", duration);
    }

    public boolean isTokenBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + token));
    }
}
