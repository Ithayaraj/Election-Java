@echo off
echo Compiling Java files...
javac -cp ".;backend/lib/mysql-connector-j-9.3.0.jar" backend\db\DatabaseConnector.java backend\models\KeyValue.java backend\services\ElectionService.java backend\controller\*.java backend\ElectionApp.java
@REM javac -cp ".;backend/lib/mysql-connector-j-9.3.0.jar" backend\ElectionApp.java

if %ERRORLEVEL% NEQ 0 (
    echo Compilation failed.
    pause
    exit /b %ERRORLEVEL%
)

echo Running program...
java -cp ".;backend/lib/mysql-connector-j-9.3.0.jar" backend.ElectionApp
pause
