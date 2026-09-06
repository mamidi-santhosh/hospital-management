# Autonomous REST API Collection Test Script for Hospital Management Microservices

$testResults = @()
$script:userId = 1
$script:doctorId = 1
$script:patientId = 1
$script:prescId = 1
$script:apptId = 1
$script:invoiceId = 1

function Test-Endpoint {
    param (
        [string]$Service,
        [string]$Uri,
        [string]$Method = "GET",
        [object]$Body = $null
    )

    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 15
        }
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 5)
        }

        $res = Invoke-RestMethod @params
        Write-Host "  [PASS] $Service -> $Method $Uri" -ForegroundColor Green
        $script:testResults += [PSCustomObject]@{ Service = $Service; Method = $Method; Endpoint = $Uri; Status = "PASS"; Error = "" }
        return $res
    } catch {
        $err = $_.Exception.Message
        Write-Host "  [FAIL] $Service -> $Method $Uri : $err" -ForegroundColor Red
        $script:testResults += [PSCustomObject]@{ Service = $Service; Method = $Method; Endpoint = $Uri; Status = "FAIL"; Error = $err }
        return $null
    }
}

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "COPILOT AUTONOMOUS FULL REST API TEST COLLECTION" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

# Wait for microservice ports to be active
$ports = @(8081, 8082, 8083, 8084)
foreach ($port in $ports) {
    Write-Host "Waiting for service on port $port to start..." -ForegroundColor Yellow
    $retries = 0
    while ($retries -lt 30) {
        try {
            $conn = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue
            if ($conn.TcpTestSucceeded) {
                Write-Host "Port $port is UP!" -ForegroundColor Green
                break
            }
        } catch {}
        Start-Sleep -Seconds 2
        $retries++
    }
}

# 1. AUTH SERVICE APIs (Port 8081)
Write-Host ""
Write-Host "[1/4] Testing Auth Service APIs (Port 8081)..." -ForegroundColor Yellow
$regBody = @{
    username = "copilot_user_$(Get-Random)"
    email = "copilot_$(Get-Random)@hospital.com"
    password = "SecurePassword123!"
    fullName = "Copilot Auto Test User"
    phoneNumber = "5551234567"
    role = "ROLE_PATIENT"
}
$regRes = Test-Endpoint -Service "Auth Service" -Uri "http://localhost:8081/api/v1/auth/register" -Method "POST" -Body $regBody
if ($regRes -and $regRes.data -and $regRes.data.id) { $script:userId = $regRes.data.id }

$loginBody = @{ username = $regBody.username; password = $regBody.password }
$loginRes = Test-Endpoint -Service "Auth Service" -Uri "http://localhost:8081/api/v1/auth/login" -Method "POST" -Body $loginBody
$refreshToken = if ($loginRes -and $loginRes.data -and $loginRes.data.refreshToken) { $loginRes.data.refreshToken } else { "" }

if ($refreshToken) {
    $refBody = @{ refreshToken = $refreshToken }
    $refRes = Test-Endpoint -Service "Auth Service" -Uri "http://localhost:8081/api/v1/auth/refresh" -Method "POST" -Body $refBody
}

$userRes = Test-Endpoint -Service "Auth Service" -Uri "http://localhost:8081/api/v1/auth/users/$script:userId" -Method "GET"

# 2. PATIENT & DOCTOR SERVICE APIs (Port 8082)
Write-Host ""
Write-Host "[2/4] Testing Patient & Doctor Service APIs (Port 8082)..." -ForegroundColor Yellow
$docBody = @{
    userId = $script:userId
    fullName = "Dr. Alexander Fleming"
    specialization = "Infectious Diseases"
    qualification = "MD, PhD"
    experienceYears = 20
    consultationFee = 250.00
    availableDays = "Mon-Fri"
    available = $true
}
$docRes = Test-Endpoint -Service "Doctor Service" -Uri "http://localhost:8082/api/v1/doctors" -Method "POST" -Body $docBody
if ($docRes -and $docRes.data -and $docRes.data.id) { $script:doctorId = $docRes.data.id }

$allDocs = Test-Endpoint -Service "Doctor Service" -Uri "http://localhost:8082/api/v1/doctors" -Method "GET"
$docDetail = Test-Endpoint -Service "Doctor Service" -Uri "http://localhost:8082/api/v1/doctors/$script:doctorId" -Method "GET"

$patientBody = @{
    userId = $script:userId
    fullName = $regBody.fullName
    dateOfBirth = "1992-04-12"
    gender = "Male"
    bloodGroup = "O+"
    phoneNumber = "5551234567"
    address = "100 AI Boulevard"
    emergencyContact = "5559876543"
}
$patientRes = Test-Endpoint -Service "Patient Service" -Uri "http://localhost:8082/api/v1/patients" -Method "POST" -Body $patientBody
if ($patientRes -and $patientRes.data -and $patientRes.data.id) { $script:patientId = $patientRes.data.id }

$allPatients = Test-Endpoint -Service "Patient Service" -Uri "http://localhost:8082/api/v1/patients" -Method "GET"
$patientByUserId = Test-Endpoint -Service "Patient Service" -Uri "http://localhost:8082/api/v1/patients/user/$script:userId" -Method "GET"

$emrBody = @{
    patientId = $script:patientId
    doctorId = $script:doctorId
    doctorName = "Dr. Alexander Fleming"
    diagnosis = "Bacterial Infection"
    treatmentPlan = "5-Day Course Antibiotics"
    notes = "Vitals stable."
}
$emrRes = Test-Endpoint -Service "EMR History" -Uri "http://localhost:8082/api/v1/patients/$script:patientId/medical-history" -Method "POST" -Body $emrBody
$emrTimeline = Test-Endpoint -Service "EMR History" -Uri "http://localhost:8082/api/v1/patients/$script:patientId/medical-history" -Method "GET"

$prescBody = @{
    patientId = $script:patientId
    patientName = $regBody.fullName
    doctorId = $script:doctorId
    doctorName = "Dr. Alexander Fleming"
    diagnosis = "Bacterial Infection"
    medicines = "Penicillin V 500mg - 1 tab 4x daily"
    instructions = "Take after meals."
}
$prescRes = Test-Endpoint -Service "Prescription Service" -Uri "http://localhost:8082/api/v1/prescriptions" -Method "POST" -Body $prescBody
if ($prescRes -and $prescRes.data -and $prescRes.data.id) { $script:prescId = $prescRes.data.id }

$patientPrescs = Test-Endpoint -Service "Prescription Service" -Uri "http://localhost:8082/api/v1/prescriptions/patient/$script:patientId" -Method "GET"

try {
    $pdf = Invoke-WebRequest -Uri "http://localhost:8082/api/v1/prescriptions/$script:prescId/pdf" -Method GET -UseBasicParsing
    Write-Host "  [PASS] OpenPDF Prescription Export -> GET http://localhost:8082/api/v1/prescriptions/$script:prescId/pdf ($($pdf.Content.Length) bytes)" -ForegroundColor Green
    $testResults += [PSCustomObject]@{ Service = "OpenPDF Prescription"; Method = "GET"; Endpoint = "prescriptions/$script:prescId/pdf"; Status = "PASS"; Error = "" }
} catch {
    Write-Host "  [FAIL] OpenPDF Prescription Export : $_" -ForegroundColor Red
    $testResults += [PSCustomObject]@{ Service = "OpenPDF Prescription"; Method = "GET"; Endpoint = "prescriptions/$script:prescId/pdf"; Status = "FAIL"; Error = $_ }
}

# 3. APPOINTMENT SERVICE APIs (Port 8083)
Write-Host ""
Write-Host "[3/4] Testing Appointment Service APIs (Port 8083)..." -ForegroundColor Yellow
$apptBody = @{
    patientId = $script:patientId
    patientName = $regBody.fullName
    doctorId = $script:doctorId
    doctorName = "Dr. Alexander Fleming"
    appointmentDate = "2026-09-25"
    appointmentTime = "09:30:00"
    fee = 250.00
    reason = "Infectious Disease Followup"
}
$apptRes = Test-Endpoint -Service "Appointment Service" -Uri "http://localhost:8083/api/v1/appointments/book" -Method "POST" -Body $apptBody
if ($apptRes -and $apptRes.data -and $apptRes.data.id) { $script:apptId = $apptRes.data.id }

$patientAppts = Test-Endpoint -Service "Appointment Service" -Uri "http://localhost:8083/api/v1/appointments/patient/$script:patientId" -Method "GET"
$docAppts = Test-Endpoint -Service "Appointment Service" -Uri "http://localhost:8083/api/v1/appointments/doctor/$script:doctorId`?date=2026-09-25" -Method "GET"
$statusRes = Test-Endpoint -Service "Appointment Service" -Uri "http://localhost:8083/api/v1/appointments/$script:apptId/status?status=IN_PROGRESS" -Method "PUT"

# 4. BILLING & INVENTORY SERVICE APIs (Port 8084)
Write-Host ""
Write-Host "[4/4] Testing Billing & Inventory Service APIs (Port 8084)..." -ForegroundColor Yellow
$staffBody = @{
    fullName = "Nurse Clara Barton"
    designation = "Charge Nurse"
    department = "Emergency"
    email = "clara_$(Get-Random)@hospital.com"
    phoneNumber = "5554443333"
    salary = 7500.00
    shift = "Day"
    active = $true
}
$staffRes = Test-Endpoint -Service "Staff Roster" -Uri "http://localhost:8084/api/v1/staff" -Method "POST" -Body $staffBody
$allStaff = Test-Endpoint -Service "Staff Roster" -Uri "http://localhost:8084/api/v1/staff" -Method "GET"

$invBody = @{
    itemName = "Penicillin V 500mg"
    category = "Medicine"
    quantity = 5
    reorderLevel = 20
    unitPrice = 15.00
    supplierName = "Global BioPharm"
}
$invRes = Test-Endpoint -Service "Inventory Service" -Uri "http://localhost:8084/api/v1/inventory" -Method "POST" -Body $invBody
$allInv = Test-Endpoint -Service "Inventory Service" -Uri "http://localhost:8084/api/v1/inventory" -Method "GET"
$lowStock = Test-Endpoint -Service "Inventory Service" -Uri "http://localhost:8084/api/v1/inventory/alerts/low-stock" -Method "GET"

$billBody = @{
    patientId = $script:patientId
    patientName = $regBody.fullName
    appointmentId = $script:apptId
    consultationFee = 250.00
    medicineCharges = 45.00
    labTestCharges = 110.00
    taxAmount = 25.00
    paymentMethod = "Insurance"
}
$billRes = Test-Endpoint -Service "Billing Service" -Uri "http://localhost:8084/api/v1/billing/invoices" -Method "POST" -Body $billBody
if ($billRes -and $billRes.data -and $billRes.data.id) { $script:invoiceId = $billRes.data.id }

$payRes = Test-Endpoint -Service "Billing Service" -Uri "http://localhost:8084/api/v1/billing/invoices/$script:invoiceId/status?status=PAID&paymentMethod=Credit%20Card" -Method "PUT"
$patientInvoices = Test-Endpoint -Service "Billing Service" -Uri "http://localhost:8084/api/v1/billing/invoices/patient/$script:patientId" -Method "GET"

try {
    $invPdf = Invoke-WebRequest -Uri "http://localhost:8084/api/v1/billing/invoices/$script:invoiceId/pdf" -Method GET -UseBasicParsing
    Write-Host "  [PASS] OpenPDF Invoice Receipt -> GET http://localhost:8084/api/v1/billing/invoices/$script:invoiceId/pdf ($($invPdf.Content.Length) bytes)" -ForegroundColor Green
    $testResults += [PSCustomObject]@{ Service = "OpenPDF Invoice"; Method = "GET"; Endpoint = "billing/invoices/$script:invoiceId/pdf"; Status = "PASS"; Error = "" }
} catch {
    Write-Host "  [FAIL] OpenPDF Invoice Receipt : $_" -ForegroundColor Red
    $testResults += [PSCustomObject]@{ Service = "OpenPDF Invoice"; Method = "GET"; Endpoint = "billing/invoices/$script:invoiceId/pdf"; Status = "FAIL"; Error = $_ }
}

# SUMMARY REPORT
Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "FINAL COPILOT AUTONOMOUS TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

$testResults | Format-Table Service, Method, Status, Endpoint -AutoSize

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count

Write-Host "Total APIs Executed : $($testResults.Count)" -ForegroundColor Cyan
Write-Host "Passed              : $passed" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "Failed              : $failed" -ForegroundColor Red
} else {
    Write-Host "Failed              : $failed" -ForegroundColor Green
}
