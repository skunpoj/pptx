@echo off
REM AI Text2PPT Pro - Deployment Verification Script (Windows)
REM This script verifies that all fixes are properly deployed

echo.
echo AI Text2PPT Pro - Deployment Verification
echo =============================================
echo.

set PASSED=0
set FAILED=0

echo Step 1: Checking Required Files
echo -----------------------------------

REM Check if critical files exist
if exist "public\index.html" (
    echo [32m[OK][0m index.html exists
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m index.html missing
    set /a FAILED+=1
)

if exist "public\js\api.js" (
    echo [32m[OK][0m api.js exists
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m api.js missing
    set /a FAILED+=1
)

if exist "public\js\ui.js" (
    echo [32m[OK][0m ui.js exists
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m ui.js missing
    set /a FAILED+=1
)

if exist "public\js\fileHandler.js" (
    echo [32m[OK][0m fileHandler.js exists
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m fileHandler.js missing
    set /a FAILED+=1
)

if exist "public\diagnostic.html" (
    echo [32m[OK][0m diagnostic.html exists (NEW)
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m diagnostic.html missing
    set /a FAILED+=1
)

if exist "public\test-integration.html" (
    echo [32m[OK][0m test-integration.html exists (NEW)
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m test-integration.html missing
    set /a FAILED+=1
)

echo.
echo Step 2: Verifying Fixes in Files
echo -----------------------------------

findstr /C:"window.showStatus" public\js\api.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m[OK][0m api.js uses window.showStatus
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m api.js missing window.showStatus
    set /a FAILED+=1
)

findstr /C:"window.displayPreview" public\js\api.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m[OK][0m api.js uses window.displayPreview
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m api.js missing window.displayPreview
    set /a FAILED+=1
)

findstr /C:"AI Idea Generator" public\index.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m[OK][0m AI Idea Generator section exists
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m AI Idea Generator section missing
    set /a FAILED+=1
)

findstr /C:"themeSelector" public\index.html >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m[OK][0m Theme Selector exists
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m Theme Selector missing
    set /a FAILED+=1
)

echo.
echo Step 3: Docker Configuration
echo -----------------------------------

if exist "Dockerfile" (
    echo [32m[OK][0m Dockerfile exists
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m Dockerfile missing
    set /a FAILED+=1
)

if exist "docker-compose.yml" (
    echo [32m[OK][0m docker-compose.yml exists
    set /a PASSED+=1
) else (
    echo [31m[FAIL][0m docker-compose.yml missing
    set /a FAILED+=1
)

echo.
echo Summary
echo -----------------------------------
set /a TOTAL=%PASSED%+%FAILED%
echo Total Checks: %TOTAL%
echo Passed: %PASSED%
echo Failed: %FAILED%
echo.

if %FAILED% equ 0 (
    echo [32mALL CHECKS PASSED![0m
    echo Ready for Docker deployment!
    echo.
    echo Next steps:
    echo 1. docker-compose build
    echo 2. docker-compose up -d
    echo 3. Visit http://localhost:3000/diagnostic.html
) else (
    echo [31mSOME CHECKS FAILED![0m
    echo Please review the failures above.
)

pause

