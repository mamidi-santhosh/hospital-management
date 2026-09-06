package com.hospital.appointment.repository;

import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(Long patientId);

    List<Appointment> findByDoctorIdAndAppointmentDateOrderByTokenNumberAsc(Long doctorId, LocalDate appointmentDate);

    @Query("SELECT MAX(a.tokenNumber) FROM Appointment a WHERE a.doctorId = :doctorId AND a.appointmentDate = :appointmentDate")
    Integer findMaxTokenNumberByDoctorAndDate(@Param("doctorId") Long doctorId, @Param("appointmentDate") LocalDate appointmentDate);

    List<Appointment> findByDoctorIdAndAppointmentDateAndStatusIn(Long doctorId, LocalDate date, List<AppointmentStatus> statuses);
}
