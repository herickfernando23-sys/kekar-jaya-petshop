# Setup KEKAR JAYA Database
# Script ini membuat database dan import schema dari file SQL

$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
$schemaPath = ".\database\mysql\01_schema.sql"
$seedPath = ".\database\mysql\02_seed.sql"

if (-not (Test-Path $mysqlPath)) {
    Write-Host "❌ MySQL tidak ditemukan di: $mysqlPath"
    Write-Host "📝 Pastikan XAMPP sudah terinstall dengan MySQL"
    exit 1
}

Write-Host "🔧 Setup Database KEKAR JAYA" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test MySQL connection
Write-Host "🔌 Testing MySQL connection..." -ForegroundColor Yellow
& $mysqlPath -u root -e "SELECT 1;" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ MySQL tidak bisa diakses!"
    Write-Host "💡 Pastikan:"
    Write-Host "   1. Buka XAMPP Control Panel"
    Write-Host "   2. Klik tombol 'Start' untuk MySQL"
    Write-Host "   3. Tunggu MySQL menjadi 'Running'"
    Write-Host "   4. Jalankan script ini lagi"
    exit 1
}
Write-Host "✅ MySQL terhubung!" -ForegroundColor Green

# Check schema file
if (-not (Test-Path $schemaPath)) {
    Write-Host "❌ File schema tidak ditemukan: $schemaPath"
    exit 1
}

# Create database and import schema
Write-Host ""
Write-Host "📦 Membuat database dan schema..." -ForegroundColor Yellow

# Drop database if exists
& $mysqlPath -u root -e "DROP DATABASE IF EXISTS kekar_jaya_petshop;" 2>$null

# Create database
& $mysqlPath -u root -e "CREATE DATABASE IF NOT EXISTS kekar_jaya_petshop DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Gagal membuat database!"
    exit 1
}

# Import schema
Write-Host "📄 Importing schema..." -ForegroundColor Gray
$schemaContent = Get-Content $schemaPath -Raw
& $mysqlPath -u root kekar_jaya_petshop -e $schemaContent
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Gagal import schema!"
    exit 1
}

# Import seed data jika ada
if (Test-Path $seedPath) {
    Write-Host "🌱 Importing seed data..." -ForegroundColor Gray
    $seedContent = Get-Content $seedPath -Raw
    & $mysqlPath -u root kekar_jaya_petshop -e $seedContent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Peringatan: Gagal import seed data, tapi schema sudah dibuat"
    }
}

Write-Host ""
Write-Host "✅ Database setup berhasil!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "📊 Database Info:"
Write-Host "   Database: kekar_jaya_petshop"
Write-Host "   User: root"
Write-Host "   Host: localhost"
Write-Host "   Port: 3306"
Write-Host ""
Write-Host "🚀 Sekarang jalankan: npm run dev:all"
Write-Host ""
