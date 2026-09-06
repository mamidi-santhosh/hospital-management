package com.hospital.patientdoctor.service;

import com.hospital.patientdoctor.entity.Prescription;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

@Service
public class PdfGeneratorService {

    public ByteArrayInputStream generatePrescriptionPdf(Prescription prescription) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Header Title
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Color.BLUE);
            Paragraph title = new Paragraph("HEALTHCARE MANAGEMENT SYSTEM", headerFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.DARK_GRAY);
            Paragraph subTitle = new Paragraph("Official Medical Prescription", subHeaderFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            subTitle.setSpacingAfter(20);
            document.add(subTitle);

            // Metadata Table
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1, 1});

            table.addCell(createCell("Prescription ID: #" + prescription.getId(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            table.addCell(createCell("Date: " + prescription.getIssueDate().toLocalDate(), FontFactory.getFont(FontFactory.HELVETICA, 12)));

            table.addCell(createCell("Doctor Name: " + prescription.getDoctorName(), FontFactory.getFont(FontFactory.HELVETICA, 12)));
            table.addCell(createCell("Patient Name: " + prescription.getPatientName(), FontFactory.getFont(FontFactory.HELVETICA, 12)));

            document.add(table);
            document.add(new Paragraph(" "));

            // Diagnosis Section
            Paragraph diagTitle = new Paragraph("Diagnosis:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
            document.add(diagTitle);
            Paragraph diagContent = new Paragraph(prescription.getDiagnosis(), FontFactory.getFont(FontFactory.HELVETICA, 12));
            diagContent.setSpacingAfter(15);
            document.add(diagContent);

            // Medicines Table Section
            Paragraph medTitle = new Paragraph("Prescribed Medications & Dosage:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
            medTitle.setSpacingAfter(5);
            document.add(medTitle);

            Paragraph medContent = new Paragraph(prescription.getMedicines(), FontFactory.getFont(FontFactory.HELVETICA, 12));
            medContent.setSpacingAfter(20);
            document.add(medContent);

            // Instructions
            if (prescription.getInstructions() != null && !prescription.getInstructions().isEmpty()) {
                Paragraph instTitle = new Paragraph("Special Instructions:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
                document.add(instTitle);
                Paragraph instContent = new Paragraph(prescription.getInstructions(), FontFactory.getFont(FontFactory.HELVETICA, 12));
                document.add(instContent);
            }

            // Footer / Doctor Signature
            Paragraph footer = new Paragraph("\n\n___________________________\nDoctor's Digital Signature", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 12));
            footer.setAlignment(Element.ALIGN_RIGHT);
            document.add(footer);

            document.close();

        } catch (DocumentException ex) {
            throw new RuntimeException("Error generating prescription PDF", ex);
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(8);
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }
}
