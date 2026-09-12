package com.hospital.patientdoctor.service;

import com.hospital.patientdoctor.dto.*;
import com.hospital.patientdoctor.entity.*;
import com.hospital.patientdoctor.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientDoctorService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;

    // Patient Operations
    @Transactional
    public PatientDto createOrUpdatePatient(PatientDto dto) {
        Patient patient = patientRepository.findByUserId(dto.getUserId())
                .orElse(Patient.builder().userId(dto.getUserId()).build());

        patient.setFullName(dto.getFullName());
        patient.setDateOfBirth(dto.getDateOfBirth());
        patient.setGender(dto.getGender());
        patient.setBloodGroup(dto.getBloodGroup());
        patient.setPhoneNumber(dto.getPhoneNumber());
        patient.setAddress(dto.getAddress());
        patient.setEmergencyContact(dto.getEmergencyContact());

        Patient saved = patientRepository.save(patient);
        return mapToPatientDto(saved);
    }

    public PatientDto getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with id: " + id));
        return mapToPatientDto(patient);
    }

    public PatientDto getPatientByUserId(Long userId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found for user id: " + userId));
        return mapToPatientDto(patient);
    }

    public List<PatientDto> getAllPatients() {
        return patientRepository.findAll().stream().map(this::mapToPatientDto).collect(Collectors.toList());
    }

    // Doctor Operations
    @Transactional
    public DoctorDto createOrUpdateDoctor(DoctorDto dto) {
        Doctor doctor = doctorRepository.findByUserId(dto.getUserId())
                .orElse(Doctor.builder().userId(dto.getUserId()).build());

        doctor.setFullName(dto.getFullName());
        doctor.setSpecialization(dto.getSpecialization());
        doctor.setQualification(dto.getQualification());
        doctor.setExperienceYears(dto.getExperienceYears());
        doctor.setConsultationFee(dto.getConsultationFee());
        doctor.setAvailableDays(dto.getAvailableDays());
        doctor.setAvailable(dto.isAvailable());

        Doctor saved = doctorRepository.save(doctor);
        return mapToDoctorDto(saved);
    }

    public List<DoctorDto> getAllDoctors(String specialization) {
        if (doctorRepository.count() == 0) {
            seedInitialDoctors();
        }
        List<Doctor> doctors = (specialization != null && !specialization.isEmpty())
                ? doctorRepository.findBySpecializationContainingIgnoreCase(specialization)
                : doctorRepository.findAll();
        return doctors.stream().map(this::mapToDoctorDto).collect(Collectors.toList());
    }

    private void seedInitialDoctors() {
        doctorRepository.save(Doctor.builder().userId(1001L).fullName("Dr. Michael Chang").specialization("Cardiology").qualification("MD, FACC").experienceYears(12).consultationFee(new java.math.BigDecimal("150.00")).availableDays("Mon-Fri").available(true).build());
        doctorRepository.save(Doctor.builder().userId(1002L).fullName("Dr. Robert Chen").specialization("Neurology").qualification("MD, PhD").experienceYears(15).consultationFee(new java.math.BigDecimal("180.00")).availableDays("Mon-Sat").available(true).build());
        doctorRepository.save(Doctor.builder().userId(1003L).fullName("Dr. Emily Vance").specialization("Pediatrics").qualification("MD, FAAP").experienceYears(8).consultationFee(new java.math.BigDecimal("120.00")).availableDays("Tue-Sun").available(true).build());
    }

    public DoctorDto getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found with id: " + id));
        return mapToDoctorDto(doctor);
    }

    public DoctorDto getDoctorByUserId(Long userId, String username, String fullName) {
        String expectedName = (fullName != null && !fullName.trim().isEmpty()) ? fullName : (username != null ? username : "User #" + userId);
        if (!expectedName.startsWith("Dr.")) {
            expectedName = "Dr. " + expectedName;
        }

        final String targetName = expectedName;

        Doctor doctor = doctorRepository.findByUserId(userId)
                .map(doc -> {
                    if (username != null && !doc.getFullName().toLowerCase().contains(username.toLowerCase()) && !doc.getFullName().equals(targetName)) {
                        doc.setFullName(targetName);
                        return doctorRepository.save(doc);
                    }
                    return doc;
                })
                .orElseGet(() -> {
                    Doctor newDoc = Doctor.builder()
                            .userId(userId)
                            .fullName(targetName)
                            .specialization("General Medicine")
                            .qualification("MD")
                            .experienceYears(5)
                            .consultationFee(new java.math.BigDecimal("150.00"))
                            .availableDays("Mon-Fri")
                            .available(true)
                            .build();
                    return doctorRepository.save(newDoc);
                });
        return mapToDoctorDto(doctor);
    }

    // Medical Records
    @Transactional
    public MedicalRecordDto addMedicalRecord(MedicalRecordDto dto) {
        MedicalRecord record = MedicalRecord.builder()
                .patientId(dto.getPatientId())
                .doctorId(dto.getDoctorId())
                .doctorName(dto.getDoctorName())
                .diagnosis(dto.getDiagnosis())
                .treatmentPlan(dto.getTreatmentPlan())
                .notes(dto.getNotes())
                .build();

        MedicalRecord saved = medicalRecordRepository.save(record);
        return mapToMedicalRecordDto(saved);
    }

    public List<MedicalRecordDto> getPatientMedicalHistory(Long patientId) {
        return medicalRecordRepository.findByPatientIdOrderByRecordDateDesc(patientId)
                .stream().map(this::mapToMedicalRecordDto).collect(Collectors.toList());
    }

    // Prescriptions
    @Transactional
    public PrescriptionDto createPrescription(PrescriptionDto dto) {
        Prescription prescription = Prescription.builder()
                .appointmentId(dto.getAppointmentId())
                .patientId(dto.getPatientId())
                .patientName(dto.getPatientName())
                .doctorId(dto.getDoctorId())
                .doctorName(dto.getDoctorName())
                .diagnosis(dto.getDiagnosis())
                .medicines(dto.getMedicines())
                .instructions(dto.getInstructions())
                .build();

        Prescription saved = prescriptionRepository.save(prescription);
        return mapToPrescriptionDto(saved);
    }

    public List<PrescriptionDto> getPatientPrescriptions(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByIssueDateDesc(patientId)
                .stream().map(this::mapToPrescriptionDto).collect(Collectors.toList());
    }

    public Prescription getPrescriptionEntity(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prescription not found with id: " + id));
    }

    // Mappers
    private PatientDto mapToPatientDto(Patient p) {
        return PatientDto.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .fullName(p.getFullName())
                .dateOfBirth(p.getDateOfBirth())
                .gender(p.getGender())
                .bloodGroup(p.getBloodGroup())
                .phoneNumber(p.getPhoneNumber())
                .address(p.getAddress())
                .emergencyContact(p.getEmergencyContact())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private DoctorDto mapToDoctorDto(Doctor d) {
        return DoctorDto.builder()
                .id(d.getId())
                .userId(d.getUserId())
                .fullName(d.getFullName())
                .specialization(d.getSpecialization())
                .qualification(d.getQualification())
                .experienceYears(d.getExperienceYears())
                .consultationFee(d.getConsultationFee())
                .availableDays(d.getAvailableDays())
                .available(d.isAvailable())
                .build();
    }

    private MedicalRecordDto mapToMedicalRecordDto(MedicalRecord r) {
        return MedicalRecordDto.builder()
                .id(r.getId())
                .patientId(r.getPatientId())
                .doctorId(r.getDoctorId())
                .doctorName(r.getDoctorName())
                .diagnosis(r.getDiagnosis())
                .treatmentPlan(r.getTreatmentPlan())
                .notes(r.getNotes())
                .recordDate(r.getRecordDate())
                .build();
    }

    private PrescriptionDto mapToPrescriptionDto(Prescription pr) {
        return PrescriptionDto.builder()
                .id(pr.getId())
                .appointmentId(pr.getAppointmentId())
                .patientId(pr.getPatientId())
                .patientName(pr.getPatientName())
                .doctorId(pr.getDoctorId())
                .doctorName(pr.getDoctorName())
                .diagnosis(pr.getDiagnosis())
                .medicines(pr.getMedicines())
                .instructions(pr.getInstructions())
                .issueDate(pr.getIssueDate())
                .build();
    }
}
