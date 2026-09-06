CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS patient_db;
CREATE DATABASE IF NOT EXISTS appt_db;
CREATE DATABASE IF NOT EXISTS billing_db;

CREATE USER IF NOT EXISTS 'hospital_user'@'%' IDENTIFIED BY 'hospital_pass';
GRANT ALL PRIVILEGES ON auth_db.* TO 'hospital_user'@'%';
GRANT ALL PRIVILEGES ON patient_db.* TO 'hospital_user'@'%';
GRANT ALL PRIVILEGES ON appt_db.* TO 'hospital_user'@'%';
GRANT ALL PRIVILEGES ON billing_db.* TO 'hospital_user'@'%';
FLUSH PRIVILEGES;
