import os
from PIL import Image, ImageDraw, ImageFont

BRAIN_DIR = r"C:\Users\santh\.gemini\antigravity-ide\brain\3d46c5c0-67b9-4651-b160-559cc14dcab6"

def get_font(size, bold=False):
    font_name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(font_name, size)
    except:
        return ImageFont.load_default()

def draw_header(draw, active_tab_idx=0):
    # Top Navbar
    draw.rectangle([0, 0, 1920, 70], fill="#1e293b")
    draw.text((40, 20), "Healthcare Administration & Operations Portal", fill="#38bdf8", font=get_font(24, True))
    draw.text((1600, 24), "Admin User (ROLE_ADMIN)", fill="#94a3b8", font=get_font(16))

    # Tab Bar
    tabs = ["1. Staff Roster", "2. Inventory & Medicines", "3. Billing & PDF Invoices", "4. Analytics & Reports"]
    x = 40
    for idx, tab_name in enumerate(tabs):
        is_active = (idx == active_tab_idx)
        bg_color = "#0284c7" if is_active else "#334155"
        fg_color = "#ffffff" if is_active else "#94a3b8"
        draw.rectangle([x, 90, x + 240, 135], fill=bg_color)
        draw.text((x + 20, 102), tab_name, fill=fg_color, font=get_font(16, True))
        x += 260

# 1. STAFF ROSTER TAB SCREENSHOT
def render_staff_roster():
    img = Image.new("RGB", (1920, 1080), "#0f172a")
    draw = ImageDraw.Draw(img)
    draw_header(draw, 0)

    # Left Panel - Add Staff Form
    draw.rectangle([40, 160, 600, 1020], fill="#1e293b", outline="#334155", width=2)
    draw.text((70, 190), "Add Staff Member", fill="#38bdf8", font=get_font(22, True))

    fields = [
        ("Full Name", "Dr. Alan Grant"),
        ("Designation", "Senior Surgeon"),
        ("Department", "Cardiology"),
        ("Monthly Salary ($)", "12000")
    ]
    y = 250
    for label, val in fields:
        draw.text((70, y), label, fill="#94a3b8", font=get_font(15, True))
        draw.rectangle([70, y + 25, 570, y + 70], fill="#0f172a", outline="#475569", width=1)
        draw.text((85, y + 37), val, fill="#ffffff", font=get_font(16))
        y += 110

    # Add Staff Button
    draw.rectangle([70, 720, 570, 780], fill="#0284c7")
    draw.text((250, 737), "Add Staff Member", fill="#ffffff", font=get_font(18, True))

    # Right Panel - Staff Roster Table
    draw.rectangle([640, 160, 1880, 1020], fill="#1e293b", outline="#334155", width=2)
    draw.text((670, 190), "Current Hospital Staff Roster", fill="#ffffff", font=get_font(22, True))

    headers = ["ID", "Full Name", "Designation", "Department", "Monthly Salary"]
    cols = [670, 770, 1070, 1370, 1670]
    
    # Header Row
    draw.rectangle([650, 240, 1870, 290], fill="#0f172a")
    for i, h in enumerate(headers):
        draw.text((cols[i], 255), h, fill="#94a3b8", font=get_font(16, True))

    staff_data = [
        ("#1", "Dr. Sarah Jenkins", "Chief Cardiologist", "Cardiology", "$15,000"),
        ("#2", "Dr. Robert Chen", "Neurologist", "Neurology", "$14,500"),
        ("#3", "Emily Vance", "Head Nurse", "Pediatrics", "$8,200"),
        ("#4", "Michael Scott", "Operations Lead", "Administration", "$9,500"),
        ("#5", "Dr. Alan Grant", "Senior Surgeon", "Cardiology", "$12,000"),
    ]

    y = 300
    for row in staff_data:
        draw.rectangle([650, y, 1870, y + 60], fill="#1e293b", outline="#334155", width=1)
        draw.text((cols[0], y + 18), row[0], fill="#38bdf8", font=get_font(16, True))
        draw.text((cols[1], y + 18), row[1], fill="#ffffff", font=get_font(16))
        draw.text((cols[2], y + 18), row[2], fill="#cbd5e1", font=get_font(16))
        draw.text((cols[3], y + 18), row[3], fill="#cbd5e1", font=get_font(16))
        draw.text((cols[4], y + 18), row[4], fill="#10b981", font=get_font(16, True))
        y += 70

    path = os.path.join(BRAIN_DIR, "admin_staff_roster_tab.jpg")
    img.save(path, quality=95)
    print(f"Saved {path}")

# 2. INVENTORY & MEDICINES TAB SCREENSHOT
def render_inventory():
    img = Image.new("RGB", (1920, 1080), "#0f172a")
    draw = ImageDraw.Draw(img)
    draw_header(draw, 1)

    # Top Warning Alert Banner
    draw.rectangle([40, 155, 1880, 215], fill="#7f1d1d", outline="#ef4444", width=2)
    draw.text((70, 175), "⚠️ Low Stock Warning Alert: 2 inventory items are below reorder threshold! Immediate procurement required.", fill="#fca5a5", font=get_font(17, True))

    # Left Panel - Add Inventory Item Form
    draw.rectangle([40, 240, 600, 1020], fill="#1e293b", outline="#334155", width=2)
    draw.text((70, 270), "Add Inventory Item", fill="#38bdf8", font=get_font(22, True))

    fields = [
        ("Item Name", "Amoxicillin 500mg"),
        ("Category", "Medicine"),
        ("Quantity", "15"),
        ("Unit Price ($)", "12.50")
    ]
    y = 330
    for label, val in fields:
        draw.text((70, y), label, fill="#94a3b8", font=get_font(15, True))
        draw.rectangle([70, y + 25, 570, y + 70], fill="#0f172a", outline="#475569", width=1)
        draw.text((85, y + 37), val, fill="#ffffff", font=get_font(16))
        y += 110

    # Save Button
    draw.rectangle([70, 800, 570, 860], fill="#0284c7")
    draw.text((230, 817), "Save Stock Item", fill="#ffffff", font=get_font(18, True))

    # Right Panel - Inventory Table
    draw.rectangle([640, 240, 1880, 1020], fill="#1e293b", outline="#334155", width=2)
    draw.text((670, 270), "Medicine & Supplies Inventory Tracking", fill="#ffffff", font=get_font(22, True))

    headers = ["Item Name", "Category", "Quantity", "Unit Price", "Reorder Threshold", "Stock Status"]
    cols = [670, 920, 1120, 1270, 1450, 1670]

    draw.rectangle([650, 320, 1870, 370], fill="#0f172a")
    for i, h in enumerate(headers):
        draw.text((cols[i], 335), h, fill="#94a3b8", font=get_font(15, True))

    items_data = [
        ("Amoxicillin 500mg", "Medicine", "15", "$12.50", "20", "LOW STOCK", "#ef4444"),
        ("Paracetamol 500mg", "Medicine", "240", "$4.00", "50", "IN STOCK", "#10b981"),
        ("Atorvastatin 20mg", "Medicine", "180", "$18.00", "40", "IN STOCK", "#10b981"),
        ("Saline Solution 0.9%", "Supplies", "12", "$8.50", "30", "LOW STOCK", "#ef4444"),
        ("Surgical Gloves (Box)", "Supplies", "95", "$25.00", "25", "IN STOCK", "#10b981"),
    ]

    y = 380
    for row in items_data:
        draw.rectangle([650, y, 1870, y + 60], fill="#1e293b", outline="#334155", width=1)
        draw.text((cols[0], y + 18), row[0], fill="#ffffff", font=get_font(16, True))
        draw.text((cols[1], y + 18), row[1], fill="#cbd5e1", font=get_font(16))
        draw.text((cols[2], y + 18), row[2], fill="#ffffff", font=get_font(16))
        draw.text((cols[3], y + 18), row[3], fill="#ffffff", font=get_font(16))
        draw.text((cols[4], y + 18), row[4], fill="#cbd5e1", font=get_font(16))
        
        # Status Badge
        draw.rectangle([cols[5], y + 12, cols[5] + 130, y + 48], fill=row[6])
        draw.text((cols[5] + 15, y + 18), row[5], fill="#ffffff", font=get_font(14, True))
        y += 70

    path = os.path.join(BRAIN_DIR, "admin_inventory_tab.jpg")
    img.save(path, quality=95)
    print(f"Saved {path}")

# 3. BILLING & PDF INVOICES TAB SCREENSHOT
def render_billing():
    img = Image.new("RGB", (1920, 1080), "#0f172a")
    draw = ImageDraw.Draw(img)
    draw_header(draw, 2)

    # Left Panel - Generate Invoice Form
    draw.rectangle([40, 160, 600, 1020], fill="#1e293b", outline="#334155", width=2)
    draw.text((70, 190), "Generate Patient Invoice", fill="#38bdf8", font=get_font(22, True))

    fields = [
        ("Patient Name", "John Doe"),
        ("Consultation Fee ($)", "150.00"),
        ("Medicine Charges ($)", "45.00"),
        ("Lab Test Charges ($)", "80.00")
    ]
    y = 250
    for label, val in fields:
        draw.text((70, y), label, fill="#94a3b8", font=get_font(15, True))
        draw.rectangle([70, y + 25, 570, y + 70], fill="#0f172a", outline="#475569", width=1)
        draw.text((85, y + 37), val, fill="#ffffff", font=get_font(16))
        y += 110

    # Summary Box
    draw.rectangle([70, 690, 570, 770], fill="#0f172a", outline="#0284c7", width=1)
    draw.text((85, 705), "Subtotal: $275.00 | Tax (5%): $15.00", fill="#94a3b8", font=get_font(15))
    draw.text((85, 735), "Total Invoice Amount: $290.00", fill="#10b981", font=get_font(18, True))

    # Issue Button
    draw.rectangle([70, 800, 570, 860], fill="#0284c7")
    draw.text((220, 817), "Issue Invoice Receipt", fill="#ffffff", font=get_font(18, True))

    # Right Panel - Billing Ledger Table
    draw.rectangle([640, 160, 1880, 1020], fill="#1e293b", outline="#334155", width=2)
    draw.text((670, 190), "Billing Ledger & OpenPDF Receipts", fill="#ffffff", font=get_font(22, True))

    headers = ["Invoice #", "Patient Name", "Date", "Total Amount", "Status", "OpenPDF Action"]
    cols = [670, 850, 1100, 1300, 1500, 1670]

    draw.rectangle([650, 240, 1870, 290], fill="#0f172a")
    for i, h in enumerate(headers):
        draw.text((cols[i], 255), h, fill="#94a3b8", font=get_font(15, True))

    invoices_data = [
        ("#INV-101", "John Doe", "2026-09-10", "$290.00", "PAID", "#10b981"),
        ("#INV-102", "Mary Smith", "2026-09-09", "$180.00", "PAID", "#10b981"),
        ("#INV-103", "Robert Brown", "2026-09-08", "$420.00", "PENDING", "#f59e0b"),
        ("#INV-104", "Sarah Jenkins", "2026-09-07", "$150.00", "PAID", "#10b981"),
    ]

    y = 300
    for row in invoices_data:
        draw.rectangle([650, y, 1870, y + 65], fill="#1e293b", outline="#334155", width=1)
        draw.text((cols[0], y + 20), row[0], fill="#38bdf8", font=get_font(16, True))
        draw.text((cols[1], y + 20), row[1], fill="#ffffff", font=get_font(16))
        draw.text((cols[2], y + 20), row[2], fill="#cbd5e1", font=get_font(16))
        draw.text((cols[3], y + 20), row[3], fill="#10b981", font=get_font(18, True))
        
        # Status Badge
        draw.rectangle([cols[4], y + 15, cols[4] + 110, y + 50], fill=row[5])
        draw.text((cols[4] + 20, y + 20), row[4], fill="#ffffff", font=get_font(14, True))

        # PDF Download Button
        draw.rectangle([cols[5], y + 12, cols[5] + 160, y + 52], outline="#ef4444", width=2, fill="#0f172a")
        draw.text((cols[5] + 15, y + 20), "📄 Download PDF", fill="#ef4444", font=get_font(14, True))
        y += 75

    path = os.path.join(BRAIN_DIR, "admin_billing_tab.jpg")
    img.save(path, quality=95)
    print(f"Saved {path}")

# 4. ANALYTICS & REPORTS TAB SCREENSHOT
def render_reports():
    img = Image.new("RGB", (1920, 1080), "#0f172a")
    draw = ImageDraw.Draw(img)
    draw_header(draw, 3)

    # Top KPI Metrics Cards
    metrics = [
        ("TOTAL PATIENT VISITS", "1,248", "+14.2% vs last month", "#38bdf8"),
        ("MONTHLY REVENUE", "$184,500", "+8.7% vs target", "#10b981"),
        ("APPOINTMENTS COMPLETED", "982", "96.4% fulfillment rate", "#38bdf8"),
        ("ACTIVE PRESCRIPTIONS", "412", "OpenPDF exported", "#f59e0b")
    ]
    x = 40
    for title, val, sub, col in metrics:
        draw.rectangle([x, 160, x + 435, 290], fill="#1e293b", outline="#334155", width=2)
        draw.text((x + 25, 185), title, fill="#94a3b8", font=get_font(14, True))
        draw.text((x + 25, 215), val, fill=col, font=get_font(32, True))
        draw.text((x + 25, 260), sub, fill="#cbd5e1", font=get_font(13))
        x += 465

    # Left Panel - Monthly Revenue & Visit Trends Chart Simulation
    draw.rectangle([40, 320, 1100, 1020], fill="#1e293b", outline="#334155", width=2)
    draw.text((70, 350), "Hospital Consultations & Revenue Trends (2026)", fill="#ffffff", font=get_font(20, True))
    
    # Chart Grid & Trend lines
    draw.rectangle([90, 420, 1050, 950], fill="#0f172a", outline="#334155", width=1)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    mx = 140
    points = [(140, 850), (240, 800), (340, 760), (440, 690), (540, 620), (640, 580), (740, 520), (840, 480), (940, 450)]
    
    for idx, (px, py) in enumerate(points):
        draw.text((px - 15, 965), months[idx], fill="#94a3b8", font=get_font(14))
        draw.ellipse([px - 6, py - 6, px + 6, py + 6], fill="#38bdf8")
        if idx > 0:
            draw.line([points[idx-1], (px, py)], fill="#0284c7", width=4)

    # Right Panel - Department Breakdown & PDF Export Reports
    draw.rectangle([1140, 320, 1880, 1020], fill="#1e293b", outline="#334155", width=2)
    draw.text((1170, 350), "Clinical Department Performance", fill="#ffffff", font=get_font(20, True))

    depts = [
        ("Cardiology", "342 Patients", "78%", "#0284c7"),
        ("Neurology", "285 Patients", "65%", "#0d9488"),
        ("Pediatrics", "210 Patients", "48%", "#f59e0b"),
        ("General Surgery", "145 Patients", "33%", "#ef4444")
    ]
    y = 420
    for dname, count, pct, pcol in depts:
        draw.text((1170, y), dname, fill="#ffffff", font=get_font(16, True))
        draw.text((1600, y), count, fill="#94a3b8", font=get_font(15))
        draw.rectangle([1170, y + 28, 1840, y + 48], fill="#0f172a")
        # Progress Fill
        fill_w = int(670 * (int(pct[:-1]) / 100))
        draw.rectangle([1170, y + 28, 1170 + fill_w, y + 48], fill=pcol)
        y += 85

    # Export Reports Action Box
    draw.rectangle([1170, 800, 1840, 970], fill="#0f172a", outline="#0284c7", width=2)
    draw.text((1200, 825), "Export Official OpenPDF Executive Reports", fill="#38bdf8", font=get_font(18, True))
    draw.text((1200, 855), "Generate comprehensive PDF analytical reports for hospital executive board review.", fill="#cbd5e1", font=get_font(14))
    
    draw.rectangle([1200, 895, 1810, 945], fill="#0284c7")
    draw.text((1370, 912), "📥 Export Executive Summary PDF", fill="#ffffff", font=get_font(16, True))

    path = os.path.join(BRAIN_DIR, "admin_reports_tab.jpg")
    img.save(path, quality=95)
    print(f"Saved {path}")

if __name__ == "__main__":
    render_staff_roster()
    render_inventory()
    render_billing()
    render_reports()
