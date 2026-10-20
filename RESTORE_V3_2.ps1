param([string]$ProjectPath = "C:\Users\Owner\Desktop\NowProjectTable\AInote_v1.5.2_GitHub_Pages")
$ErrorActionPreference = 'Stop'
$source = $PSScriptRoot
if (-not (Test-Path (Join-Path $ProjectPath '.git'))) { throw 'ProjectPath must point to existing Git repository.' }
Write-Host 'Backing up current tracked/untracked project files (excluding .git and node_modules)...'
$backup = Join-Path $ProjectPath ("backup-before-v3.2-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup | Out-Null
$files = @('index.html','cloud-config.js','cloud.js','app.js','explorer.js','renderer.js','mermaid-support.js','style.css','toc.js','cloud-worker/worker.js','cloud-worker/wrangler.toml','cloud-worker/package.json','cloud-worker/schema.sql','cloud-worker/migrate_v3_2.sql')
foreach($file in $files){
  $target=Join-Path $ProjectPath $file
  if(Test-Path $target){$b=Join-Path $backup $file;New-Item -ItemType Directory -Force -Path (Split-Path $b) | Out-Null;Copy-Item $target $b -Force}
}
foreach($file in $files){
  $from=Join-Path $source $file
  if(Test-Path $from){$to=Join-Path $ProjectPath $file;New-Item -ItemType Directory -Force -Path (Split-Path $to) | Out-Null;Copy-Item $from $to -Force}
}
Write-Host "Files restored to v3.2. Backup: $backup"
Write-Host 'Checking status and Worker URL...'
git -C $ProjectPath status --short
Get-Content (Join-Path $ProjectPath 'cloud-config.js')
Write-Host 'Next: inspect changes; then git add / commit / push. Worker deployment is separate.'
