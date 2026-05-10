@echo off
REM Setup KEKAR JAYA Database - Batch Version
REM This script will try to connect to MySQL and setup the database

setlocal enabledelayedexpansion

echo.
echo ================================
echo  KEKAR JAYA Database Setup
echo ================================
echo.

REM Try different MySQL paths
set "MYSQL_PATH="
if exist "C:\xampp\mysql\bin\mysql.exe" (
    set "MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe"
    echo [INFO] Found MySQL at XAMPP
) else if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    echo [INFO] Found MySQL at Program Files
) else if exist "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_PATH=C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe"
    echo [INFO] Found MySQL at Program Files (x86)
) else (
    echo [ERROR] MySQL not found!
    echo Please install MySQL or XAMPP first.
    pause
    exit /b 1
)

echo.
echo [INFO] Testing MySQL connection...
"%MYSQL_PATH%" -u root -e "SELECT VERSION();" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Cannot connect to MySQL!
    echo.
    echo Please follow these steps:
    echo 1. Open XAMPP Control Panel (C:\xampp\xampp-control.exe)
    echo 2. Click "Start" button for MySQL
    echo 3. Wait until MySQL shows "Running" in green
    echo 4. Come back and run this script again
    echo.
    pause
    exit /b 1
)

echo [SUCCESS] MySQL is running!
echo.
echo [INFO] Creating database...

"%MYSQL_PATH%" -u root -e "DROP DATABASE IF EXISTS kekar_jaya_petshop;" >nul 2>&1
"%MYSQL_PATH%" -u root -e "CREATE DATABASE kekar_jaya_petshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Failed to create database!
    pause
    exit /b 1
)

echo [SUCCESS] Database created!
echo.

REM Import schema file
if exist "database\mysql\01_schema.sql" (
    echo [INFO] Importing schema...
    "%MYSQL_PATH%" -u root kekar_jaya_petshop < "database\mysql\01_schema.sql"
    if errorlevel 1 (
        echo [WARNING] Schema import had issues, but continuing...
    ) else (
        echo [SUCCESS] Schema imported!
    )
) else (
    echo [WARNING] Schema file not found at database\mysql\01_schema.sql
)

echo.

REM Import seed data
if exist "database\mysql\02_seed.sql" (
    echo [INFO] Importing sample data...
    "%MYSQL_PATH%" -u root kekar_jaya_petshop < "database\mysql\02_seed.sql"
    if errorlevel 1 (
        echo [WARNING] Seed data import had issues
    ) else (
        echo [SUCCESS] Sample data imported!
    )
) else (
    echo [INFO] Seed file not found (optional)
)

echo.
echo ================================
echo [SUCCESS] Database setup complete!
echo ================================
echo.
echo Database: kekar_jaya_petshop
echo User: root
echo Host: localhost
echo Port: 3306
echo.
echo Next: Run "npm run dev:all" to start the application
echo.
pause
