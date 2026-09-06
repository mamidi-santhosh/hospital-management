package com.hospital.appointment.saga;

import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.entity.AppointmentStatus;
import com.hospital.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.retrytopic.TopicSuffixingStrategy;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class SagaOrchestratorConsumer {

    private final AppointmentRepository appointmentRepository;

    @RetryableTopic(
            attempts = "3",
            backoff = @Backoff(delay = 1000, multiplier = 2.0),
            topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE
    )
    @KafkaListener(topics = "appointment-saga-topic", groupId = "appointment-group")
    @Transactional
    public void consumeSagaEvent(AppointmentSagaEvent event) {
        log.info("Consuming Saga Event: {} for Appointment ID: {}", event.getEventType(), event.getAppointmentId());

        if ("BOOKING_INITIATED".equals(event.getEventType())) {
            Appointment appointment = appointmentRepository.findById(event.getAppointmentId())
                    .orElse(null);

            if (appointment != null) {
                // Simulate billing check or downstream validation
                if (event.getFee() != null && event.getFee().doubleValue() < 0) {
                    throw new RuntimeException("Invalid fee amount. Saga step failed.");
                }
                appointment.setStatus(AppointmentStatus.CONFIRMED);
                appointmentRepository.save(appointment);
                log.info("Appointment ID: {} successfully CONFIRMED by Saga Orchestrator", appointment.getId());
            }
        }
    }

    @DltHandler
    @Transactional
    public void handleDeadLetterTopic(AppointmentSagaEvent event) {
        log.error("Saga Event moved to DLT! Triggering Compensating Transaction for Appointment ID: {}", event.getAppointmentId());

        Appointment appointment = appointmentRepository.findById(event.getAppointmentId())
                .orElse(null);

        if (appointment != null) {
            appointment.setStatus(AppointmentStatus.CANCELLED);
            appointmentRepository.save(appointment);
            log.info("Compensating Transaction executed: Appointment ID: {} set to CANCELLED", appointment.getId());
        }
    }
}
