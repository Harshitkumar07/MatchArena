# PowerShell script to install Java for Firebase Emulators
# Run as Administrator

Write-Host "Installing Java for Firebase Emulators..." -ForegroundColor Green

# Check if Chocolatey is installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install OpenJDK
Write-Host "Installing OpenJDK 11..." -ForegroundColor Yellow
choco install openjdk11 -y

# Refresh environment variables
Write-Host "Refreshing environment variables..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify installation
Write-Host "Verifying Java installation..." -ForegroundColor Yellow
java -version

if ($LASTEXITCODE -eq 0) {
    Write-Host "Java installed successfully!" -ForegroundColor Green
    Write-Host "You can now run: firebase emulators:start" -ForegroundColor Green
} else {
    Write-Host "Java installation failed. Please install Java manually from:" -ForegroundColor Red
    Write-Host "https://adoptium.net/" -ForegroundColor Yellow
}

Write-Host "`nNOTE: You may need to restart your terminal for the changes to take effect." -ForegroundColor Cyan