import os
from PIL import Image

directory = r'c:\Users\SAVE Company\.gemini\antigravity\playground\primal-expanse\derechos-laborales-mx\frontend\src\assets\guides'
files = [
    'checklistrenuncia.png',
    'desglose_nomina_es.png',
    'guiacontrato.png',
    'guiaderechos.png',
    'guiafiniquito.png'
]

for filename in files:
    path = os.path.join(directory, filename)
    try:
        # Open the file (PIL detects format automatically)
        with Image.open(path) as img:
            print(f"Opening {filename}: Format={img.format}, Mode={img.mode}")
            
            # If it's not PNG or we just want to enforce re-saving as PNG
            # We save it to a temp path then overwrite
            temp_path = path + ".temp.png"
            img.save(temp_path, format='PNG')
        
        # Replace original with new PNG
        os.remove(path)
        os.rename(temp_path, path)
        print(f"Converted and saved {filename} as real PNG.")
        
    except Exception as e:
        print(f"Failed to convert {filename}: {e}")
