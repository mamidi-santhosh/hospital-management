package com.hospital.billinginventory.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    @Async
    public void sendEmail(String to, String subject, String body) {
        log.info("Sending Email Notification to: [{}] with Subject: [{}]", to, subject);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply.hospital.mgmt@gmail.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email successfully sent to: {}", to);
        } catch (Exception e) {
            log.warn("SMTP server unavailable or email dispatch failed. (Logged gracefully): {}", e.getMessage());
        }
    }
}
