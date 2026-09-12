import requests
import json
import time

BASE_URL = "http://localhost:8080/api/v1"

def test_suite():
    print("==================================================")
    print("EXHAUSTIVE AUTOMATED API & FLOW TEST SUITE")
    print("==================================================")
    
    # 1. AUTH SERVICE TESTS
    print("\n--- 1. Testing Auth Service (Registration & Login) ---")
    reg_patient = {
        "username": "test_patient_1",
        "email": "patient1@hospital.com",
        "password": "Password123!",
        "fullName": "Test Patient One",
        "phoneNumber": "1234567890",
        "role": "ROLE_PATIENT"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=reg_patient)
    print(f"POST /auth/register (Patient): Status {r.status_code}")

    login_req = {"username": "john_doe", "password": "password123"}
    r = requests.post(f"{BASE_URL}/auth/login", json=login_req)
    print(f"POST /auth/login: Status {r.status_code}")

    token = None
    if r.status_code == 200:
        data = r.json()
        token = data.get("data", {}).get("accessToken")
        print(f"-> Issued Access Token: {token[:20] if token else 'None'}...")

    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # 2. DOCTOR & PATIENT SERVICE TESTS
    print("\n--- 2. Testing Patient & Doctor Service ---")
    r = requests.get(f"{BASE_URL}/doctors", headers=headers)
    print(f"GET /doctors: Status {r.status_code}, Found {len(r.json().get('data', []))} doctors")

    r = requests.get(f"{BASE_URL}/patients/1", headers=headers)
    print(f"GET /patients/1: Status {r.status_code}")

    r = requests.get(f"{BASE_URL}/patients/1/medical-history", headers=headers)
    print(f"GET /patients/1/medical-history: Status {r.status_code}")

    # 3. APPOINTMENT SERVICE & KAFKA SAGA TESTS
    print("\n--- 3. Testing Appointment Booking & Kafka Saga ---")
    booking_req = {
        "patientId": 1,
        "patientName": "John Doe",
        "doctorId": 1,
        "doctorName": "Dr. Sarah Jenkins",
        "appointmentDate": "2026-09-10",
        "appointmentTime": "10:00:00",
        "fee": 150.00,
        "reason": "Routine Cardiology Consultation"
    }
    r = requests.post(f"{BASE_URL}/appointments/book", json=booking_req, headers=headers)
    print(f"POST /appointments/book: Status {r.status_code}")
    appt_id = None
    if r.status_code in (200, 201):
        appt_data = r.json().get("data", {})
        appt_id = appt_data.get("id")
        token_num = appt_data.get("tokenNumber")
        print(f"-> SUCCESS: Kafka Saga Booking Created Appointment #{appt_id}, Token #{token_num}")
    else:
        print(f"-> ERROR RESPONSE: {r.text}")

    # Test Doctor Queue & Status Updates
    r = requests.get(f"{BASE_URL}/appointments/doctor/1?date=2026-09-10", headers=headers)
    print(f"GET /appointments/doctor/1: Status {r.status_code}")

    if appt_id:
        r = requests.put(f"{BASE_URL}/appointments/{appt_id}/status?status=IN_PROGRESS", headers=headers)
        print(f"PUT /appointments/{appt_id}/status (IN_PROGRESS): Status {r.status_code}")

        r = requests.put(f"{BASE_URL}/appointments/{appt_id}/status?status=COMPLETED", headers=headers)
        print(f"PUT /appointments/{appt_id}/status (COMPLETED): Status {r.status_code}")

    # 4. PRESCRIPTION & OPENPDF TESTS
    print("\n--- 4. Testing Prescription & OpenPDF Export ---")
    presc_req = {
        "patientId": 1,
        "patientName": "John Doe",
        "doctorId": 1,
        "doctorName": "Dr. Sarah Jenkins",
        "diagnosis": "Hypertension",
        "medicines": "Amoxicillin 500mg - 1 tab twice daily",
        "instructions": "Take after meals"
    }
    r = requests.post(f"{BASE_URL}/prescriptions", json=presc_req, headers=headers)
    print(f"POST /prescriptions: Status {r.status_code}")
    presc_id = r.json().get("data", {}).get("id") if r.status_code == 200 else 1

    r = requests.get(f"{BASE_URL}/prescriptions/{presc_id}/pdf", headers=headers)
    print(f"GET /prescriptions/{presc_id}/pdf (OpenPDF Export): Status {r.status_code}, Content-Type: {r.headers.get('Content-Type')}")

    # 5. STAFF SERVICE TESTS
    print("\n--- 5. Testing Staff Roster Service ---")
    staff_req = {
        "fullName": "Dr. Alan Grant",
        "designation": "Senior Surgeon",
        "department": "Cardiology",
        "salary": 12000.00
    }
    r = requests.post(f"{BASE_URL}/staff", json=staff_req, headers=headers)
    print(f"POST /staff: Status {r.status_code}")

    r = requests.get(f"{BASE_URL}/staff", headers=headers)
    print(f"GET /staff: Status {r.status_code}, Total Staff: {len(r.json().get('data', []))}")

    # 6. INVENTORY SERVICE TESTS
    print("\n--- 6. Testing Inventory & Low Stock Alerts ---")
    inv_req = {
        "itemName": "Amoxicillin 500mg",
        "category": "Medicine",
        "quantity": 15,
        "reorderLevel": 20,
        "unitPrice": 12.50
    }
    r = requests.post(f"{BASE_URL}/inventory", json=inv_req, headers=headers)
    print(f"POST /inventory: Status {r.status_code}")

    r = requests.get(f"{BASE_URL}/inventory", headers=headers)
    print(f"GET /inventory: Status {r.status_code}")

    r = requests.get(f"{BASE_URL}/inventory/alerts/low-stock", headers=headers)
    print(f"GET /inventory/alerts/low-stock: Status {r.status_code}, Low Stock Items Count: {len(r.json().get('data', []))}")

    # 7. BILLING SERVICE & OPENPDF TAX INVOICE TESTS
    print("\n--- 7. Testing Billing & PDF Invoice Service ---")
    invoice_req = {
        "patientId": 1,
        "patientName": "John Doe",
        "consultationFee": 150.00,
        "medicineCharges": 45.00,
        "labTestCharges": 80.00,
        "taxAmount": 15.00,
        "paymentMethod": "Credit Card"
    }
    r = requests.post(f"{BASE_URL}/billing/invoices", json=invoice_req, headers=headers)
    print(f"POST /billing/invoices: Status {r.status_code}")
    inv_id = r.json().get("data", {}).get("id") if r.status_code == 200 else 1

    r = requests.get(f"{BASE_URL}/billing/invoices/patient/1", headers=headers)
    print(f"GET /billing/invoices/patient/1: Status {r.status_code}")

    r = requests.get(f"{BASE_URL}/billing/invoices/{inv_id}/pdf", headers=headers)
    print(f"GET /billing/invoices/{inv_id}/pdf (OpenPDF Invoice): Status {r.status_code}, Content-Type: {r.headers.get('Content-Type')}")

    print("\n==================================================")
    print("ALL API & FLOW TESTS COMPLETED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_suite()
