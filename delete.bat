@echo off
echo Deleting all .class files in backend directory...
for /R backend %%f in (*.class) do (
    del "%%f"
)
echo All .class files deleted.
pause
