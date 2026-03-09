# Simple static file server in PowerShell
# Usage: run from project root with `powershell -ExecutionPolicy Bypass -File serve.ps1`

param(
    [int]$Port = 8000,
    [string]$Root = (Get-Location).Path
)

Write-Host "Serving $Root on http://localhost:$Port/ (Ctrl+C to stop)"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$Port/")
$listener.Start()

while ($true) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $urlPath = $req.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrEmpty($urlPath)) { $urlPath = 'index.html' }

    $file = Join-Path $Root $urlPath
    if (Test-Path $file -PathType Leaf) {
        try {
            $bytes = [System.IO.File]::ReadAllBytes($file)
            $res.ContentLength64 = $bytes.Length
            $res.ContentType = switch ([IO.Path]::GetExtension($file).ToLower()) {
                '.html' { 'text/html' }
                '.css'  { 'text/css' }
                '.js'   { 'application/javascript' }
                '.png'  { 'image/png' }
                '.jpg'  { 'image/jpeg' }
                '.jpeg' { 'image/jpeg' }
                default { 'application/octet-stream' }
            }
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $res.StatusCode = 500
            $res.StatusDescription = "Internal Server Error"
        }
    } else {
        $res.StatusCode = 404
        $res.StatusDescription = "Not Found"
        $msg = "File not found: $urlPath"
        $buf = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $res.OutputStream.Write($buf, 0, $buf.Length)
    }
    $res.OutputStream.Close()
}
