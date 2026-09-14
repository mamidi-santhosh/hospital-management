package com.hospital.appointment.service;

import com.hospital.appointment.dto.AppointmentBookingRequest;
import com.hospital.appointment.dto.AppointmentDto;
import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.entity.AppointmentStatus;
import com.hospital.appointment.repository.AppointmentRepository;
import com.hospital.appointment.saga.AppointmentSagaEvent;
import com.hospital.appointment.saga.SagaOrchestratorProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final SagaOrchestratorProducer sagaProducer;
    private final TokenStreamingService tokenStreamingService;

    @Transactional
    public AppointmentDto bookAppointment(AppointmentBookingRequest request) {
        Integer maxToken = appointmentRepository.findMaxTokenNumberByDoctorAndDate(
                request.getDoctorId(), request.getAppointmentDate());
        int nextToken = (maxToken == null) ? 1 : maxToken + 1;

        Appointment appointment = Appointment.builder()
                .patientId(request.getPatientId())
                .patientName(request.getPatientName())
                .doctorId(request.getDoctorId())
                .doctorName(request.getDoctorName())
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .tokenNumber(nextToken)
                .fee(request.getFee())
                .status(AppointmentStatus.PENDING)
                .reason(request.getReason())
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        // Publish Saga Event to Kafka
        AppointmentSagaEvent sagaEvent = AppointmentSagaEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .appointmentId(saved.getId())
                .patientId(saved.getPatientId())
                .doctorId(saved.getDoctorId())
                .fee(saved.getFee())
                .eventType("BOOKING_INITIATED")
                .status("PENDING")
                .build();

        sagaProducer.publishSagaEvent(sagaEvent);

        return mapToDto(saved);
    }

    @Transactional
    public AppointmentDto updateStatus(Long appointmentId, AppointmentStatus status) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found with id: " + appointmentId));

        appt.setStatus(status);
        Appointment saved = appointmentRepository.save(appt);

        // Fetch all appointments for doctor today ordered by token number
        List<Appointment> allToday = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByTokenNumberAsc(
                saved.getDoctorId(), saved.getAppointmentDate());

        Appointment inProgress = allToday.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.IN_PROGRESS)
                .findFirst().orElse(null);

        Appointment nextUpcoming = allToday.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CONFIRMED || a.getStatus() == AppointmentStatus.PENDING)
                .findFirst().orElse(null);

        Appointment lastCompleted = allToday.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .reduce((first, second) -> second).orElse(null);

        int currentServingToken = inProgress != null ? inProgress.getTokenNumber() : (lastCompleted != null ? lastCompleted.getTokenNumber() : 0);
        int nextUpcomingToken = nextUpcoming != null ? nextUpcoming.getTokenNumber() : 0;
        int totalInQueue = (int) allToday.stream().filter(a -> a.getStatus() != AppointmentStatus.CANCELLED && a.getStatus() != AppointmentStatus.COMPLETED).count();

        tokenStreamingService.broadcastTokenUpdate(
                saved.getDoctorId(),
                saved.getDoctorName(),
                currentServingToken,
                nextUpcomingToken,
                totalInQueue
        );

        return mapToDto(saved);
    }

    public List<AppointmentDto> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDesc(patientId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<AppointmentDto> getDoctorAppointments(Long doctorId, java.time.LocalDate date) {
        return appointmentRepository.findByDoctorIdAndAppointmentDateOrderByTokenNumberAsc(doctorId, date)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private AppointmentDto mapToDto(Appointment a) {
        return AppointmentDto.builder()
                .id(a.getId())
                .patientId(a.getPatientId())
                .patientName(a.getPatientName())
                .doctorId(a.getDoctorId())
                .doctorName(a.getDoctorName())
                .appointmentDate(a.getAppointmentDate())
                .appointmentTime(a.getAppointmentTime())
                .tokenNumber(a.getTokenNumber())
                .fee(a.getFee())
                .status(a.getStatus())
                .reason(a.getReason())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
