import pandas as pd
import sys
import os

def read_excel_safely(file_path):
    try:
        # Try reading the file, if it fails due to permission, try copying it first
        try:
            df = pd.read_excel(file_path)
            return df
        except PermissionError:
            temp_path = "temp_compare_" + os.path.basename(file_path)
            import shutil
            shutil.copy(file_path, temp_path)
            df = pd.read_excel(temp_path)
            os.remove(temp_path)
            return df
    except Exception as e:
        print(f"Error reading Excel: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python compare_excel.py <excel_path>")
        sys.exit(1)
    df = read_excel_safely(sys.argv[1])
    if df is not None:
        print(df.to_string())
