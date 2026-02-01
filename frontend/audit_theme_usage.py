import os
import re

SOURCE_DIR = r"c:\Users\Save Company\.gemini\antigravity\playground\primal-expanse\derechos-laborales-mx\frontend\src"

def audit():
    print("Scanning for Broken Theme Usage...")
    broken_apptheme = []
    broken_theme = []
    
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.endswith(".tsx") or file.endswith(".ts"):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()

                # CHECK 1: Uses AppTheme but doesn't import it
                if "AppTheme" in content and "export const AppTheme" not in content:
                    # Check imports loosely
                    if not re.search(r'import\s+.*AppTheme', content):
                        # print(f"POSSIBLE ERROR: {file} uses AppTheme but likely doesn't import it.")
                        broken_apptheme.append(file)

                # CHECK 2: Uses 'theme' (bare) and not imported
                # Exclude strings 'theme', "theme", property .theme, type Theme
                # We want bare word usage: ' theme.' or ' theme '
                # This is harder to regex perfectly but let's try strict word boundary
                
                # Matches: theme.colors, (theme), = theme, return theme
                if re.search(r'(?<![\.\'\"\/])\btheme\b(?![\:\'\"\/])', content):
                     if "export const theme" not in content and "import { theme }" not in content and "import {theme}" not in content:
                        # Ignore common false positives like "theme: 'light'" in obj
                        if not re.search(r'\btheme\s*:', content):
                             broken_theme.append(file)
                             
    print("\n--- FILES USING AppTheme WITHOUT IMPORT ---")
    for f in broken_apptheme:
        print(f"MISSING IMPORT: {f}")
        
    print("\n--- FILES USING theme (OLD) WITHOUT IMPORT ---")
    for f in broken_theme:
        # Filter out false positives manually by looking at lines?
        print(f"POSSIBLE OLD USAGE: {f}")

if __name__ == "__main__":
    audit()
