package com.hospital.patientdoctor.repository;

import com.hospital.patientdoctor.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientIdOrderByIssueDateDesc(Long patientId);
    List<Prescription> findByDoctorId(Long doctorId);
}
