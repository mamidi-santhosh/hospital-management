import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

BRAIN_DIR = r"C:\Users\santh\.gemini\antigravity-ide\brain\3d46c5c0-67b9-4651-b160-559cc14dcab6"
OUTPUT_DIR = r"c:\Mamidi\2026\POC\hospital management\pdf_documents_v2"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Image map with dedicated tab screenshots
images_map = {
    "f1_s1": os.path.join(BRAIN_DIR, "flow1_step1_login_initial_1789046604607.jpg"),
    "f1_s2": os.path.join(BRAIN_DIR, "flow1_step2_register_view_1789046627493.jpg"),
    "f1_s3": os.path.join(BRAIN_DIR, "flow1_step3_auth_success_1789046888774.jpg"),
    "f2_s1": os.path.join(BRAIN_DIR, "flow2_step1_booking_form_1789046915663.jpg"),
    "f2_s2": os.path.join(BRAIN_DIR, "flow2_step2_token_confirmed_1789046944032.jpg"),
    "f3_s1": os.path.join(BRAIN_DIR, "flow3_step1_doctor_queue_1789046970555.jpg"),
    "f3_s2": os.path.join(BRAIN_DIR, "flow3_step2_prescription_modal_1789046994774.jpg"),
    "f4_s1": os.path.join(BRAIN_DIR, "flow4_step1_websocket_live_1789047020167.jpg"),
    "login": os.path.join(BRAIN_DIR, "login_page_screenshot_1789046381932.jpg"),
    "patient": os.path.join(BRAIN_DIR, "patient_dashboard_screenshot_1789046409450.jpg"),
    "doctor": os.path.join(BRAIN_DIR, "doctor_dashboard_screenshot_1789046436041.jpg"),
    "queue": os.path.join(BRAIN_DIR, "live_queue_widget_screenshot_1789046456542.jpg"),
    "admin_staff": os.path.join(BRAIN_DIR, "admin_staff_roster_tab.jpg"),
    "admin_inventory": os.path.join(BRAIN_DIR, "admin_inventory_tab.jpg"),
    "admin_billing": os.path.join(BRAIN_DIR, "admin_billing_tab.jpg"),
    "admin_reports": os.path.join(BRAIN_DIR, "admin_reports_tab.jpg"),
}

styles = getSampleStyleSheet()

# Typography styling
title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.HexColor('#0284c7'), spaceAfter=4)
subtitle_style = ParagraphStyle('DocSubTitle', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=10, leading=13, textColor=colors.HexColor('#64748b'), spaceAfter=8)
h2_style = ParagraphStyle('Heading2_Custom', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=16, textColor=colors.HexColor('#0f172a'), spaceBefore=12, spaceAfter=4)
h3_style = ParagraphStyle('Heading3_Custom', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=colors.HexColor('#0d9488'), spaceBefore=8, spaceAfter=3)
body_style = ParagraphStyle('Body_Custom', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13, textColor=colors.HexColor('#334155'), spaceAfter=4)
bold_body = ParagraphStyle('Bold_Body', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor('#0f172a'))
script_style = ParagraphStyle('Script_Custom', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=9, leading=12, textColor=colors.HexColor('#0f172a'))

def create_header_banner(title, board_id, route, persona):
    data = [
        [Paragraph(f"<b>UX FLOW SPECIFICATION: {title.upper()}</b>", ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=11, textColor=colors.white)), ""],
        [Paragraph(f"<b>Figma Board ID:</b> {board_id} | <b>Route URL:</b> {route}", ParagraphStyle('H2', fontName='Helvetica', fontSize=8.5, textColor=colors.HexColor('#e2e8f0'))), ""],
        [Paragraph(f"<b>Target Persona:</b> {persona}", ParagraphStyle('H3', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.HexColor('#38bdf8'))), ""]
    ]
    t = Table(data, colWidths=[520, 0])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0f172a')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,-1), (-1,-1), 3, colors.HexColor('#0284c7')),
    ]))
    return t

def create_script_box(script_text):
    data = [
        [Paragraph("<b>🎙️ LIVE DEMO SPEAKER PRESENTATION SCRIPT</b>", ParagraphStyle('SHead', fontName='Helvetica-Bold', fontSize=9.5, textColor=colors.HexColor('#0284c7')))],
        [Paragraph(f'"{script_text}"', script_style)]
    ]
    t = Table(data, colWidths=[520])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f9ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#38bdf8')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def create_step_table(step_num, step_title, user_action, ui_state, backend_action, img_key):
    elements = []
    header_p = Paragraph(f"<b>STEP {step_num}: {step_title.upper()}</b>", ParagraphStyle('SH', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#0d9488')))
    elements.append(header_p)
    
    details_data = [
        [Paragraph("<b>User Action:</b>", bold_body), Paragraph(user_action, body_style)],
        [Paragraph("<b>UI Layout State:</b>", bold_body), Paragraph(ui_state, body_style)],
        [Paragraph("<b>Backend Trigger:</b>", bold_body), Paragraph(backend_action, body_style)]
    ]
    det_t = Table(details_data, colWidths=[100, 410])
    det_t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 2),
    ]))
    elements.append(det_t)
    elements.append(Spacer(1, 4))

    img_path = images_map.get(img_key)
    if img_path and os.path.exists(img_path):
        elements.append(Image(img_path, width=510, height=270))
        elements.append(Spacer(1, 4))
    
    return elements

# BUILD FLOW 1
def build_pdf_flow1():
    pdf_path = os.path.join(OUTPUT_DIR, "Flow_1_OAuth2_Authentication_and_Security.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    story = [
        create_header_banner("OAuth2 Authentication, Registration & Token Lifecycle", "FIG-FLOW-01-AUTH", "http://localhost:3000/login", "All Personas (Patient, Doctor, Admin, Staff)"),
        Spacer(1, 8),
        Paragraph("1. Complete Flow Architectural Overview", h2_style),
        Paragraph("This flow handles user authentication, role-based registration, dual-token JWT generation (15m Access Token / 7d Refresh Token), Redis cache stampede protection via mutex locking (SETNX), and role-based dashboard routing.", body_style),
        Spacer(1, 8)
    ]
    story.extend(create_step_table(1, "Unauthenticated Access & Initial Sign In Screen", "User opens http://localhost:3000/login or attempts to visit a protected route.", "Glassmorphism container centered on slate background (#0f172a). Sign In tab active by default.", "React router guards intercept request and render LoginPage.jsx.", "f1_s1"))
    story.append(Spacer(1, 6))
    story.extend(create_step_table(2, "User Registration Form & Role Assignment", "User clicks 'Register' tab and enters Full Name, Username, Email, Password, Phone Number, and selects Role.", "Dynamic form re-renders displaying User Role dropdown (ROLE_PATIENT, ROLE_DOCTOR, ROLE_ADMIN, ROLE_STAFF).", "POST /api/v1/auth/register calls AuthService to save User entity in auth_db.", "f1_s2"))
    story.append(Spacer(1, 6))
    story.extend(create_step_table(3, "Credential Authentication & Dual JWT Issue", "User submits Sign In form with valid username and password.", "Auth service returns 200 OK with accessToken, refreshToken, and user profile object.", "POST /api/v1/auth/login generates JWTs and saves session in Redis with stampede protection.", "f1_s3"))
    story.append(Spacer(1, 6))
    story.append(create_script_box("Welcome to our Healthcare System. Here we see our unified OAuth2 authentication flow. When a user submits credentials, Spring Gateway forwards the request to Auth microservice, issuing a 15-minute JWT access token with a 7-day refresh token stored in Redis. Notice how the application instantly routes the user to their role-specific portal!"))
    doc.build(story)
    print(f"Generated {pdf_path}")

# BUILD FLOW 2
def build_pdf_flow2():
    pdf_path = os.path.join(OUTPUT_DIR, "Flow_2_Patient_Appointment_Booking_and_Kafka_Saga.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    story = [
        create_header_banner("Patient Appointment Booking & Kafka Saga Orchestration", "FIG-FLOW-02-PATIENT", "http://localhost:3000/patient", "Patient (ROLE_PATIENT)"),
        Spacer(1, 8),
        Paragraph("1. Complete Flow Architectural Overview", h2_style),
        Paragraph("Enables patients to schedule medical consultations with specialized doctors. Submitting an appointment triggers a distributed transaction orchestrated via Apache Kafka Saga across appointment-service and patient-doctor-service.", body_style),
        Spacer(1, 8)
    ]
    story.extend(create_step_table(1, "Doctor Selection & Appointment Input Form", "Patient selects doctor from roster, inputs appointment date, time, and visit reason.", "Left panel shows 'Book Appointment (Kafka Saga)' card with doctor dropdown (Dr. Sarah Jenkins - Cardiology $150).", "Form submission triggers handleBookAppointment() sending POST /api/v1/appointments/book.", "f2_s1"))
    story.append(Spacer(1, 6))
    story.extend(create_step_table(2, "Kafka Saga Event Orchestration & Token Confirmation", "Patient clicks 'Schedule & Issue Token' button.", "Status chip displays 'Saga Event Initiated! Booked Appointment Token #101'. Table highlights CONFIRMED green chip.", "Appointment Service saves booking (PENDING), emits APPOINTMENT_CREATED to Kafka, Patient Service verifies slot, and updates status to CONFIRMED.", "f2_s2"))
    story.append(Spacer(1, 6))
    story.extend(create_step_table(3, "Patient Portal Overview & OpenPDF Prescriptions", "Patient views scheduled appointments table and prescription cards with red 'Download PDF' buttons.", "Right panel displays active appointments and downloaded EMR records.", "GET /api/v1/prescriptions/{id}/pdf fetches OpenPDF document byte stream.", "patient"))
    story.append(Spacer(1, 6))
    story.append(create_script_box("Now we are in the Patient Portal. Let's schedule an appointment with Dr. Sarah Jenkins. Clicking 'Schedule & Issue Token' initiates a Kafka Saga Orchestration workflow. The Appointment Service creates a pending record and emits a Kafka event. Within milliseconds, Token #101 appears on screen with a green CONFIRMED status!"))
    doc.build(story)
    print(f"Generated {pdf_path}")

# BUILD FLOW 3
def build_pdf_flow3():
    pdf_path = os.path.join(OUTPUT_DIR, "Flow_3_Doctor_Clinical_Consultation_and_Prescriptions.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    story = [
        create_header_banner("Doctor Clinical Queue & Digital Prescription Engine", "FIG-FLOW-03-DOCTOR", "http://localhost:3000/doctor", "Doctor (ROLE_DOCTOR)"),
        Spacer(1, 8),
        Paragraph("1. Complete Flow Architectural Overview", h2_style),
        Paragraph("Allows doctors to view their daily consultation patient queue, update patient statuses (IN_PROGRESS, COMPLETED), and issue official digital prescriptions rendered via OpenPDF.", body_style),
        Spacer(1, 8)
    ]
    story.extend(create_step_table(1, "Today's Consultation Patient Queue Management", "Doctor Jenkins logs in and views today's scheduled patient queue table.", "Queue table lists Token # (#101), Patient Name, Time Slot, Status Chip, Visit Reason, and Action Buttons.", "GET /api/v1/appointments/doctor/{doctorId}?date={today} fetches active doctor queue.", "f3_s1"))
    story.append(Spacer(1, 6))
    story.extend(create_step_table(2, "Digital Prescription Editor Dialog Modal", "Doctor clicks 'Write Prescription' for patient John Doe.", "Modal dialog overlays portal with fields for Diagnosis, Prescribed Medicines & Dosage, and Special Instructions.", "POST /api/v1/prescriptions sends payload to patient-doctor-service to invoke OpenPDF engine.", "f3_s2"))
    story.append(Spacer(1, 6))
    story.extend(create_step_table(3, "Doctor Clinical Portal & Consultation Completion", "Doctor updates status to IN_PROGRESS when calling patient and COMPLETED upon finishing consultation.", "Table updates with live status chips and action buttons.", "PUT /api/v1/appointments/{id}/status?status=COMPLETED updates appt_db.", "doctor"))
    story.append(Spacer(1, 6))
    story.append(create_script_box("Switching to the Doctor Portal, Dr. Jenkins views today's queue. Clicking 'Call Patient' updates status to IN_PROGRESS. After examining the patient, clicking 'Write Prescription' opens our clinical editor. Submitting the form calls our OpenPDF engine to render an official PDF prescription available instantly!"))
    doc.build(story)
    print(f"Generated {pdf_path}")

# BUILD FLOW 4
def build_pdf_flow4():
    pdf_path = os.path.join(OUTPUT_DIR, "Flow_4_RealTime_Live_Queue_Token_Stream.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    story = [
        create_header_banner("Real-Time STOMP WebSocket Live Queue Token Stream", "FIG-FLOW-04-QUEUE", "http://localhost:3000/queue", "Public Lobby / Waiting Display"),
        Spacer(1, 8),
        Paragraph("1. Complete Flow Architectural Overview", h2_style),
        Paragraph("Provides a real-time public display for hospital lobby monitors showing live serving tokens, upcoming tokens, and waiting queue counts broadcast over STOMP WebSockets.", body_style),
        Spacer(1, 8)
    ]
    story.extend(create_step_table(1, "STOMP WebSocket Connection & Live Token Stream", "Lobby monitor opens http://localhost:3000/queue.", "Top right chip glows with green pulse 'Live WebSocket Active'. 3 metric cards display Current Serving (#4), Next (#5), and Queue (12).", "SockJS connects to /ws-token on port 8083. STOMP subscribes to /topic/queue/{doctorId}.", "f4_s1"))
    story.append(Spacer(1, 6))
    story.extend(create_step_table(2, "Live Queue Public Lobby Display Layout", "Full lobby waiting display layout with doctor selection dropdown and Advance Token control button.", "Metric cards update dynamically in real time whenever queue status changes.", "Redis Pub/Sub broadcasts event to STOMP WebSocket subscribers.", "queue"))
    story.append(Spacer(1, 6))
    story.append(create_script_box("Here is our Real-Time Token Queue Stream for hospital lobby displays. Notice the green pulse showing an active STOMP WebSocket connection to port 8083. When a doctor calls a patient, the Current Serving Token updates instantly from #4 to #5 with zero page refresh!"))
    doc.build(story)
    print(f"Generated {pdf_path}")

# BUILD FLOW 5: DEDICATED STAFF ROSTER PDF
def build_pdf_flow5():
    pdf_path = os.path.join(OUTPUT_DIR, "Flow_5_Hospital_Staff_Roster_Management.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    story = [
        create_header_banner("Hospital Staff Roster Management & Personnel Onboarding", "FIG-FLOW-05-STAFF", "http://localhost:3000/admin (Tab 1)", "Administrator (ROLE_ADMIN)"),
        Spacer(1, 8),
        Paragraph("1. Complete Flow Architectural Overview", h2_style),
        Paragraph("Allows administrators to onboard medical staff members, track designations across clinical departments (Cardiology, Surgery, Neurology), and manage monthly compensation rosters.", body_style),
        Spacer(1, 8)
    ]
    story.extend(create_step_table(
        1, "Staff Roster Management Tab & Personnel Onboarding Form",
        "Admin opens /admin Tab 1 'Staff Roster'. Enters Full Name (Dr. Alan Grant), Designation (Senior Surgeon), Department (Cardiology), and Monthly Salary ($12,000).",
        "Left panel shows 'Add Staff Member' form fields. Right panel shows 'Current Hospital Staff Roster' table listing staff with green salary text ($15,000, $14,500, $12,000).",
        "POST /api/v1/staff executes JPA entity save to billing_db via billing-inventory-service on port 8084.",
        "admin_staff"
    ))
    story.append(Spacer(1, 6))
    story.append(create_script_box("In the Admin Portal under Staff Roster, administrators can onboard hospital personnel across departments such as Cardiology and Surgery. Entering staff details and clicking 'Add Staff' writes directly to our Billing & Inventory service, instantly updating our active roster!"))
    doc.build(story)
    print(f"Generated {pdf_path}")

# BUILD FLOW 6: DEDICATED INVENTORY & MEDICINES PDF
def build_pdf_flow6():
    pdf_path = os.path.join(OUTPUT_DIR, "Flow_6_Medical_Inventory_Control_and_Low_Stock_Alerts.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    story = [
        create_header_banner("Medical Inventory Control & Automated Low Stock Warning Engine", "FIG-FLOW-06-INVENTORY", "http://localhost:3000/admin (Tab 2)", "Admin / Procurement Staff"),
        Spacer(1, 8),
        Paragraph("1. Complete Flow Architectural Overview", h2_style),
        Paragraph("Monitors pharmaceuticals and medical supplies in real-time, triggering top-level warning banners and red LOW STOCK status badges whenever item stock drops below reorder thresholds.", body_style),
        Spacer(1, 8)
    ]
    story.extend(create_step_table(
        1, "Pharmaceutical Inventory Tracking & Low Stock Alert Banner",
        "Admin switches to /admin Tab 2 'Inventory & Medicines'. Views stock items (Amoxicillin, Paracetamol, Saline Solution) with quantity and unit price.",
        "Top amber alert banner displays '⚠️ Low Stock Warning Alert: 2 inventory items are below reorder threshold!'. Table highlights bright red 'LOW STOCK' badges.",
        "GET /api/v1/inventory/alerts/low-stock executes query WHERE quantity <= reorder_level in billing_db.",
        "admin_inventory"
    ))
    story.append(Spacer(1, 6))
    story.append(create_script_box("Next is Inventory Control. Maintaining pharmaceutical stock is critical. If stock falls below reorder levels—for instance, Amoxicillin with 15 units—the system automatically highlights the row with a red 'LOW STOCK' badge and triggers a top-level alert for procurement!"))
    doc.build(story)
    print(f"Generated {pdf_path}")

# BUILD FLOW 7: DEDICATED BILLING & PDF INVOICES PDF
def build_pdf_flow7():
    pdf_path = os.path.join(OUTPUT_DIR, "Flow_7_Financial_Billing_Ledger_and_PDF_Invoices.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    story = [
        create_header_banner("Financial Billing Ledger & OpenPDF Invoice Receipts", "FIG-FLOW-07-BILLING", "http://localhost:3000/admin (Tab 3)", "Admin / Billing Clerk"),
        Spacer(1, 8),
        Paragraph("1. Complete Flow Architectural Overview", h2_style),
        Paragraph("Enables administrators to generate patient billing invoices incorporating breakdown of consultation fees, medicine charges, and lab tests, with full OpenPDF tax invoice export functionality.", body_style),
        Spacer(1, 8)
    ]
    story.extend(create_step_table(
        1, "Billing Ledger & Itemized OpenPDF Tax Receipt Export",
        "Admin opens /admin Tab 3 'Billing & PDF Invoices', inputs Consultation Fee ($150), Medicine Charges ($45), Lab Charges ($80), and clicks 'Issue Invoice Receipt'.",
        "Ledger table displays Invoice #INV-101, Patient John Doe, Total Amount ($290.00 in green bold text), PAID status chip, and red '📄 Download PDF' action button.",
        "POST /api/v1/billing/invoices computes tax ($15) and total ($290). GET /api/v1/billing/invoices/{id}/pdf streams itemized OpenPDF receipt.",
        "admin_billing"
    ))
    story.append(Spacer(1, 6))
    story.append(create_script_box("Finally, in Flow 7, we have the Billing Ledger. Administrators input consultation, pharmacy, and laboratory fees. When we issue an invoice, the system computes taxes and total amounts. Clicking 'Invoice PDF' calls OpenPDF through Spring Gateway to stream an official, itemized hospital receipt!"))
    doc.build(story)
    print(f"Generated {pdf_path}")

# BUILD FLOW 8: DEDICATED ANALYTICS & REPORTS PDF
def build_pdf_flow8():
    pdf_path = os.path.join(OUTPUT_DIR, "Flow_8_Hospital_Analytics_and_Executive_Reports.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    story = [
        create_header_banner("Hospital Performance Analytics & Executive OpenPDF Reports", "FIG-FLOW-08-REPORTS", "http://localhost:3000/admin (Tab 4)", "Executive Board / Hospital Director"),
        Spacer(1, 8),
        Paragraph("1. Complete Flow Architectural Overview", h2_style),
        Paragraph("Provides comprehensive hospital performance KPI metrics, revenue trend graphs, clinical department fulfillment rates, and automated OpenPDF executive summary report exports.", body_style),
        Spacer(1, 8)
    ]
    story.extend(create_step_table(
        1, "Executive Analytics Dashboard & Report PDF Export",
        "Admin/Executive switches to /admin Tab 4 'Analytics & Reports'.",
        "Displays 4 KPI Metric Cards (Patient Visits 1,248, Revenue $184,500, Appointments 982, Active Prescriptions 412), Revenue Trend Line Chart, Department Breakdown, and 'Export Executive Summary PDF' button.",
        "Aggregates clinical data across microservices to generate executive PDF summary reports for board review.",
        "admin_reports"
    ))
    story.append(Spacer(1, 6))
    story.append(create_script_box("In Flow 8, our Analytics & Executive Reports portal gives hospital directors real-time visibility into patient volume, monthly revenue, and departmental performance. Clicking 'Export Executive Summary PDF' compiles an executive report for board meetings!"))
    doc.build(story)
    print(f"Generated {pdf_path}")

# BUILD MASTER CONSOLIDATED PDF
def build_master_pdf():
    pdf_path = os.path.join(OUTPUT_DIR, "Healthcare_Management_Master_UX_Demo_Guide.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    story = [
        create_header_banner("Healthcare Management System — Master Demo Suite", "MASTER-DEMO-SUITE", "http://localhost:3000", "All System Personas"),
        Spacer(1, 8),
        Paragraph("Master Presentation & End-to-End Visual Demo Suite", h2_style),
        Paragraph("This master presentation document consolidates all 8 end-to-end application flows into a unified visual guide featuring step-by-step UI screenshots, microservices data flows, and speaker presentation scripts.", body_style),
        Spacer(1, 10)
    ]

    flows_data = [
        ("Flow 1: OAuth2 Authentication & Identity Management", images_map["f1_s1"], "User registration, OAuth2 JWT login, Redis stampede protection, and role routing."),
        ("Flow 2: Patient Appointment Booking & Kafka Saga", images_map["f2_s1"], "Roster selection, Kafka Saga Orchestration, Token #101 assignment, and OpenPDF prescriptions."),
        ("Flow 3: Doctor Clinical Queue & Digital Prescriptions", images_map["f3_s1"], "Consultation queue management, Call Patient status, and digital prescription modal."),
        ("Flow 4: Real-Time STOMP Live Queue Token Stream", images_map["f4_s1"], "Live STOMP WebSockets token broadcast over Redis Pub/Sub for hospital lobby displays."),
        ("Flow 5: Hospital Staff Roster Management", images_map["admin_staff"], "Staff onboarding, department assignments, and monthly compensation roster management."),
        ("Flow 6: Medical Inventory Control & Low Stock Alerts", images_map["admin_inventory"], "Pharmaceutical stock tracking, reorder levels, red LOW STOCK badges & alert banner."),
        ("Flow 7: Financial Billing Ledger & PDF Invoices", images_map["admin_billing"], "Consultation, pharmacy, lab fee itemization, tax computation, and OpenPDF invoices."),
        ("Flow 8: Hospital Performance Analytics & Executive Reports", images_map["admin_reports"], "Executive KPI metric cards, revenue trend charts, department breakdown, and PDF export."),
    ]

    for title, img_p, desc in flows_data:
        story.append(Paragraph(title, h3_style))
        story.append(Paragraph(desc, body_style))
        if os.path.exists(img_p):
            story.append(Image(img_p, width=510, height=270))
        story.append(Spacer(1, 10))

    doc.build(story)
    print(f"Generated {pdf_path}")

if __name__ == "__main__":
    build_pdf_flow1()
    build_pdf_flow2()
    build_pdf_flow3()
    build_pdf_flow4()
    build_pdf_flow5()
    build_pdf_flow6()
    build_pdf_flow7()
    build_pdf_flow8()
    build_master_pdf()
