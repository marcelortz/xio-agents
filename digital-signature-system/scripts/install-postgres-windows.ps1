# PostgreSQL Installation Script for Windows
# Run as Administrator

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  PostgreSQL Installation for XIO Governance System         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📋 Installation Options:" -ForegroundColor Yellow
Write-Host "1. Chocolatey (Recommended)" -ForegroundColor Green
Write-Host "2. Direct Download"
Write-Host "3. Docker Desktop"
Write-Host "4. Setup Manual PostgreSQL"

$choice = Read-Host "`nSelect option (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n📦 Installing via Chocolatey..." -ForegroundColor Cyan
        Write-Host "Checking if Chocolatey is installed..."

        if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
            Write-Host "❌ Chocolatey not found. Installing Chocolatey..." -ForegroundColor Yellow
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        }

        Write-Host "✅ Installing PostgreSQL 15..." -ForegroundColor Green
        choco install postgresql15 -y --params '/Password:postgres'

        Write-Host "`n✅ PostgreSQL installed successfully!" -ForegroundColor Green
        Write-Host "   Default user: postgres" -ForegroundColor Cyan
        Write-Host "   Default password: postgres" -ForegroundColor Cyan
    }

    "2" {
        Write-Host "`n📥 PostgreSQL Download Instructions:" -ForegroundColor Cyan
        Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        Write-Host "2. Run the installer"
        Write-Host "3. Set password for postgres user"
        Write-Host "4. Keep default port 5432"
        Write-Host "5. Complete installation"
        Write-Host "`nPress any key when installation is complete..."
        Read-Host
    }

    "3" {
        Write-Host "`n🐳 Docker Installation Instructions:" -ForegroundColor Cyan
        Write-Host "1. Install Docker Desktop from: https://www.docker.com/products/docker-desktop"
        Write-Host "2. Run Docker Desktop"
        Write-Host "3. Execute this command:" -ForegroundColor Yellow
        Write-Host "   docker run --name xio-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=xio_governance -p 5432:5432 -d postgres:15-alpine"
        Write-Host "`nOr run:"
        Write-Host "   ./scripts/docker-postgres.sh"
    }

    "4" {
        Write-Host "`n🔧 Manual PostgreSQL Setup:" -ForegroundColor Cyan
    }
}

Write-Host "`n✅ Continue with Post-Installation Setup..." -ForegroundColor Green

# Test connection
Write-Host "`n🧪 Testing PostgreSQL Connection..." -ForegroundColor Cyan
Write-Host "Waiting for PostgreSQL to start..." -ForegroundColor Yellow

$attempts = 0
$maxAttempts = 30

while ($attempts -lt $maxAttempts) {
    try {
        # Try to connect (requires PostgreSQL CLI to be installed)
        # For now, just check if port is open
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $result = $tcpClient.BeginConnect("localhost", 5432, $null, $null)
        $result.AsyncWaitHandle.WaitOne(3000, $false) | Out-Null

        if ($tcpClient.Connected) {
            Write-Host "✅ PostgreSQL is running on port 5432" -ForegroundColor Green
            $tcpClient.Close()
            break
        }
    }
    catch {}

    $attempts++
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline
}

if ($attempts -eq $maxAttempts) {
    Write-Host "`n⚠️  PostgreSQL not responding. Please check installation." -ForegroundColor Yellow
} else {
    Write-Host "`n✅ PostgreSQL is ready!" -ForegroundColor Green
}

# Next steps
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm install pg dotenv" -ForegroundColor Yellow
Write-Host "2. Create database:"
Write-Host "   psql -U postgres -c `"CREATE DATABASE xio_governance;`""
Write-Host "3. Create user:"
Write-Host "   psql -U postgres -c `"CREATE USER xio_admin WITH PASSWORD 'secure_password';`""
Write-Host "4. Run migration:"
Write-Host "   psql -U xio_admin -d xio_governance -f scripts/migrate-to-postgres.sql"
Write-Host "5. Migrate data:"
Write-Host "   npm run build && npx ts-node scripts/migrate-sqlite-to-postgres.ts"

Write-Host "`n✨ Installation complete!" -ForegroundColor Green
