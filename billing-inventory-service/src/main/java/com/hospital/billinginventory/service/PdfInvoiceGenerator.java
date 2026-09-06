package com.hospital.billinginventory.service;

import com.hospital.billinginventory.entity.BillingInvoice;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

@Service
public class PdfInvoiceGenerator {

    public ByteArrayInputStream generateInvoicePdf(BillingInvoice invoice) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Hospital Banner Header
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.DARK_GRAY);
            Paragraph title = new Paragraph("HEALTHCARE HOSPITAL INVOICE", headerFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph subTitle = new Paragraph("Tax Invoice & Payment Receipt", FontFactory.getFont(FontFactory.HELVETICA, 12, Color.GRAY));
            subTitle.setAlignment(Element.ALIGN_CENTER);
            subTitle.setSpacingAfter(20);
            document.add(subTitle);

            // Invoice Summary Table
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);

            metaTable.addCell(createCell("Invoice Number: #INV-" + invoice.getId(), true));
            metaTable.addCell(createCell("Date: " + invoice.getInvoiceDate().toLocalDate(), false));
            metaTable.addCell(createCell("Patient Name: " + invoice.getPatientName(), false));
            metaTable.addCell(createCell("Status: " + invoice.getStatus().name(), true));

            document.add(metaTable);
            document.add(new Paragraph(" "));

            // Charges Breakdown Table
            PdfPTable itemTable = new PdfPTable(2);
            itemTable.setWidthPercentage(100);
            itemTable.setWidths(new float[]{3, 1});

            itemTable.addCell(createHeaderCell("Charge Description"));
            itemTable.addCell(createHeaderCell("Amount ($)"));

            itemTable.addCell(createCell("Consultation Fee", false));
            itemTable.addCell(createCell(String.valueOf(invoice.getConsultationFee()), false));

            itemTable.addCell(createCell("Pharmacy / Medicine Charges", false));
            itemTable.addCell(createCell(String.valueOf(invoice.getMedicineCharges()), false));

            itemTable.addCell(createCell("Laboratory & Diagnostic Tests", false));
            itemTable.addCell(createCell(String.valueOf(invoice.getLabTestCharges()), false));

            itemTable.addCell(createCell("Tax (GST/VAT)", false));
            itemTable.addCell(createCell(String.valueOf(invoice.getTaxAmount()), false));

            itemTable.addCell(createCell("TOTAL PAYABLE", true));
            itemTable.addCell(createCell("$" + invoice.getTotalAmount(), true));

            document.add(itemTable);

            // Footer Note
            Paragraph footer = new Paragraph("\nThank you for choosing Healthcare Hospital. Wish you a speedy recovery!", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 11));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();

        } catch (DocumentException ex) {
            throw new RuntimeException("Error generating invoice PDF", ex);
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private PdfPCell createCell(String text, boolean bold) {
        Font font = bold ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12) : FontFactory.getFont(FontFactory.HELVETICA, 12);
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(8);
        return cell;
    }

    private PdfPCell createHeaderCell(String text) {
        Font font = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE);
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(Color.DARK_GRAY);
        cell.setPadding(8);
        return cell;
    }
}
