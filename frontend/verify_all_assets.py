import os
import sys
from PIL import Image

def verify_images(start_dir):
    print(f"Scanning {start_dir}...")
    bad_files = []
    checked_count = 0
    
    for root, dirs, files in os.walk(start_dir):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                path = os.path.join(root, file)
                checked_count += 1
                try:
                    with Image.open(path) as img:
                        img.verify() # Verify file integrity
                        # Also try to load it to be sure
                        with Image.open(path) as img2:
                             img2.load()
                except Exception as e:
                    print(f"❌ CORRUPT: {path} - {e}")
                    bad_files.append(path)
                
    print(f"\nScanned {checked_count} images.")
    if bad_files:
        print(f"Found {len(bad_files)} corrupted files!")
        for f in bad_files:
            print(f" - {f}")
        sys.exit(1)
    else:
        print("✅ All images verified successfully.")
        sys.exit(0)

base_path = r'c:\Users\Save Company\.gemini\antigravity\playground\primal-expanse\derechos-laborales-mx\frontend'
# Check both assets locations
dirs_to_check = [
    os.path.join(base_path, 'assets'),
    os.path.join(base_path, 'src', 'assets')
]

for d in dirs_to_check:
    if os.path.exists(d):
        verify_images(d)
    else:
        print(f"Skipping {d} (not found)")
