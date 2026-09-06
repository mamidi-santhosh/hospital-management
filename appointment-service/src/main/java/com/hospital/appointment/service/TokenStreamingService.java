package com.hospital.appointment.service;

import com.hospital.appointment.dto.TokenQueueMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenStreamingService {

    private final SimpMessagingTemplate messagingTemplate;
    private final StringRedisTemplate redisTemplate;

    public void broadcastTokenUpdate(Long doctorId, String doctorName, Integer currentToken, Integer nextToken, Integer totalQueue) {
        TokenQueueMessage message = TokenQueueMessage.builder()
                .doctorId(doctorId)
                .doctorName(doctorName)
                .currentServingToken(currentToken)
                .nextUpcomingToken(nextToken)
                .totalInQueue(totalQueue)
                .timestamp(LocalDateTime.now())
                .build();

        // 1. Store latest state in Redis
        String redisKey = "queue:status:" + doctorId;
        redisTemplate.opsForValue().set(redisKey, currentToken + ":" + totalQueue);

        // 2. Broadcast via WebSocket to subscribed clients
        String destination = "/topic/queue/" + doctorId;
        log.info("Broadcasting live token update to {}: Token #{}", destination, currentToken);
        messagingTemplate.convertAndSend(destination, message);
    }
}
