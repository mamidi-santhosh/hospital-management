# Healthcare Management System - Automated Launch Script (Windows PowerShell)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Launching Healthcare Management System Infrastructure" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Step 1: Launch Docker Infrastructure
Write-Host "`n[1/3] Starting Docker Containers (MySQL, Redis, Kafka, Zookeeper, Zipkin)..." -ForegroundColor Yellow
docker-compose up -d

# Step 2: Build Microservices
Write-Host "`n[2/3] Compiling Java Microservices..." -ForegroundColor Yellow
mvn clean compile -DskipTests

# Step 3: Launch Microservices in separate windows
Write-Host "`n[3/3] Booting Microservices & React Frontend..." -ForegroundColor Green

Start-Process powershell -ArgumentList "-NoExit -Command Write-Host 'Eureka Server [Port 8761]'; mvn -pl eureka-server spring-boot:run"
Start-Sleep -Seconds 12

Start-Process powershell -ArgumentList "-NoExit -Command Write-Host 'API Gateway [Port 8080]'; mvn -pl api-gateway spring-boot:run"
Start-Sleep -Seconds 8

Start-Process powershell -ArgumentList "-NoExit -Command Write-Host 'Auth Service [Port 8081]'; mvn -pl auth-service spring-boot:run"
Start-Process powershell -ArgumentList "-NoExit -Command Write-Host 'Patient Doctor Service [Port 8082]'; mvn -pl patient-doctor-service spring-boot:run"
Start-Process powershell -ArgumentList "-NoExit -Command Write-Host 'Appointment Service [Port 8083]'; mvn -pl appointment-service spring-boot:run"
Start-Process powershell -ArgumentList "-NoExit -Command Write-Host 'Billing Inventory Service [Port 8084]'; mvn -pl billing-inventory-service spring-boot:run"

# Launch Frontend
Start-Process powershell -ArgumentList "-NoExit -Command Write-Host 'React Frontend [Port 3000]'; Set-Location frontend; npm run dev"

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "✨ All services launched successfully!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📡 Eureka Server Dashboard: http://localhost:8761" -ForegroundColor Cyan
Write-Host "📊 Zipkin Tracing: http://localhost:9411" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
