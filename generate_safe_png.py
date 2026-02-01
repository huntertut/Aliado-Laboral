
import struct
import zlib
import os

def create_png(width, height, filename):
    # PNG Signature
    png_sig = b'\x89PNG\r\n\x1a\n'
    
    # IHDR Chunk
    # Width (4), Height (4), BitDepth (1), ColorType (1), Compression (1), Filter (1), Interlace (1)
    # ColorType 2 = TrueColor (RGB)
    ihdr_data = struct.pack('!I I B B B B B', width, height, 8, 2, 0, 0, 0)
    ihdr = struct.pack('!I', len(ihdr_data)) + b'IHDR' + ihdr_data
    ihdr += struct.pack('!I', zlib.crc32(b'IHDR' + ihdr_data))
    
    # IDAT Chunk (Image Data)
    # Rows of (Filter + RGB * Width)
    raw_data = b''
    for _ in range(height):
        raw_data += b'\x00' # No filter
        raw_data += b'\x1e\x37\x99' * width # Color #1e3799 (Aliado Blue)
        
    compressed_data = zlib.compress(raw_data)
    idat = struct.pack('!I', len(compressed_data)) + b'IDAT' + compressed_data
    idat += struct.pack('!I', zlib.crc32(b'IDAT' + compressed_data))
    
    # IEND Chunk
    iend_data = b''
    iend = struct.pack('!I', len(iend_data)) + b'IEND' + iend_data
    iend += struct.pack('!I', zlib.crc32(b'IEND' + iend_data))
    
    with open(filename, 'wb') as f:
        f.write(png_sig)
        f.write(ihdr)
        f.write(idat)
        f.write(iend)
    
    print(f"Generated clean PNG: {filename}")

if __name__ == "__main__":
    target_dir = r"c:\Users\Save Company\.gemini\antigravity\playground\primal-expanse\derechos-laborales-mx\frontend\assets\images"
    native_dir = r"c:\Users\Save Company\.gemini\antigravity\playground\primal-expanse\derechos-laborales-mx\frontend\android\app\src\main\res\drawable"
    
    # Generate Safe App Logo
    create_png(512, 512, os.path.join(target_dir, "app_logo.png"))
    
    # Generate Safe Splash Logo (Native)
    if os.path.exists(native_dir):
        create_png(512, 512, os.path.join(native_dir, "splashscreen_logo.png"))
    else:
        print(f"Warning: Native dir not found: {native_dir}")

    # Overwrite the 'aliado_logo_new' as well to be safe
    create_png(512, 512, os.path.join(target_dir, "aliado_logo_new.png"))
