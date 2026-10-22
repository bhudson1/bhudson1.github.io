
@echo off
cd /d "%~dp0"

"C:\Program Files\ArcGIS\Pro\bin\Python\envs\arcgispro-py3\python.exe" -m http.server 8000

pause