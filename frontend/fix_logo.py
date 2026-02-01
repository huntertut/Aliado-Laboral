import os
from PIL import Image

# Path to the logo
logo_path = r'c:\Users\Save Company\.gemini\antigravity\playground\primal-expanse\derechos-laborales-mx\frontend\assets\images\logo.png'

try:
    print(f"Checking {logo_path}...")
    
    # Check if file exists
    if not os.path.exists(logo_path):
        print("Error: logo.png not found!")
        exit(1)

    # Open the image
    with Image.open(logo_path) as img:
        print(f"Format: {img.format}, Mode: {img.mode}, Size: {img.size}")
        
        # Save to a temp file
        temp_path = logo_path + ".temp.png"
        img.save(temp_path, format="PNG")
        print("Re-saved to temp file.")

    # Convert original to backup
    backup_path = logo_path + ".bak"
    if os.path.exists(backup_path):
        os.remove(backup_path)
    
    os.rename(logo_path, backup_path)
    print(f"Original backed up to {backup_path}")

    # Rename temp to original
    os.rename(temp_path, logo_path)
    print("SUCCESS: Logo sanitized and replaced.")

except Exception as e:
    print(f"FAILURE: Could not fix logo: {e}")
