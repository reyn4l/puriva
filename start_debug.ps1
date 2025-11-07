param(
    [int]$Port = 8000
)

# Start in the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Starting local HTTP server on port $Port..."
# Start python http.server in a new PowerShell window and keep it open
Start-Process powershell -ArgumentList "-NoExit","-Command","py -3 -m http.server $Port"

Start-Sleep -Seconds 1
Write-Host "Opening browser to http://localhost:$Port/index.html"
Start-Process "http://localhost:$Port/index.html"

Write-Host "Server launched. Close the server window to stop."
