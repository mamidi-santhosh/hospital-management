package com.hospital.appointment.saga;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SagaOrchestratorProducer {

    private static final String TOPIC = "appointment-saga-topic";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishSagaEvent(AppointmentSagaEvent event) {
        log.info("Publishing Saga Event: [{}] for Appointment ID: {}", event.getEventType(), event.getAppointmentId());
        kafkaTemplate.send(TOPIC, String.valueOf(event.getAppointmentId()), event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Saga Event published successfully to partition {}", result.getRecordMetadata().partition());
                    } else {
                        log.error("Failed to publish Saga Event for appointment {}", event.getAppointmentId(), ex);
                    }
                });
    }
}
