
import struct
import os

def inspect_png(filename):
    print(f"Inspecting: {filename}")
    try:
        with open(filename, 'rb') as f:
            # Check Signature
            sig = f.read(8)
            if sig != b'\x89PNG\r\n\x1a\n':
                print(f"[FAIL] Invalid PNG Signature: {sig}")
                return False

            # Read Fragments until IHDR
            while True:
                length_bytes = f.read(4)
                if len(length_bytes) < 4: break
                length = struct.unpack('!I', length_bytes)[0]
                
                chunk_type = f.read(4)
                
                if chunk_type == b'IHDR':
                    data = f.read(length)
                    # IHDR is 13 bytes
                    width, height, bit_depth, color_type, compression, filter_method, interlace = struct.unpack('!I I B B B B B', data)
                    
                    print(f"  [OK] Valid PNG Header found.")
                    print(f"  - Dimensions: {width}x{height}")
                    print(f"  - Bit Depth: {bit_depth}")
                    print(f"  - Color Type: {color_type} (6=RGBA, 2=RGB, 3=Palette)")
                    print(f"  - Interlace: {interlace} ({'DETECTED! Bad for Android' if interlace == 1 else 'None - Good'})")
                    
                    if width != height:
                        print(f"  [WARN] Image is not square! This might look stretched.")
                    
                    if interlace != 0:
                         print(f"  [FAIL] Interlacing is enabled. Android AAPT may reject this.")
                    else:
                         print(f"  [PASS] Structure looks compliant.")
                    
                    return True
                else:
                    # Skip data and CRC
                    f.seek(length + 4, 1)
                    
    except Exception as e:
        print(f"[ERROR] Could not read file: {e}")
        return False

if __name__ == "__main__":
    target = r"c:\Users\Save Company\.gemini\antigravity\playground\primal-expanse\derechos-laborales-mx\frontend\assets\images\app_logo.png"
    inspect_png(target)
