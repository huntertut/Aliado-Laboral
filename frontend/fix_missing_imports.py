import os
import re

SOURCE_DIR = r"c:\Users\Save Company\.gemini\antigravity\playground\primal-expanse\derechos-laborales-mx\frontend\src"

def fix_files():
    count = 0
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.endswith(".tsx") or file.endswith(".ts"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Check if AppTheme is used
                # We look for "AppTheme." or "AppTheme " or "AppTheme," or "AppTheme)" etc.
                if "AppTheme" not in content:
                    continue

                # Check if AppTheme is imported
                # Simple check: "import {... AppTheme ...} from"
                # or just "AppTheme" appearing in an import line.
                
                # We need to distinguish between IMPORTING it and USING it.
                # Regex for import: import .*AppTheme.* from
                
                has_import = re.search(r'import\s+.*AppTheme.*\s+from', content)
                
                if not has_import:
                    # Check if it *should* be imported from theme/colors
                    # If the file imports OTHER things from theme/colors, we should append AppTheme.
                    
                    # Pattern: import { ... } from '.../theme/colors';
                    # We want to insert AppTheme into the braces.
                    
                    if "theme/colors" in content:
                        print(f"Fixing missing import in: {file}")
                        
                        # Regex to find the import line for theme/colors
                        # import { a, b } from '../theme/colors';
                        # Replace with import { a, b, AppTheme } from '../theme/colors';
                        
                        def replace_import(match):
                            original = match.group(0)
                            if "AppTheme" in original:
                                return original # Already there (maybe specific regex failed earlier)
                            
                            # Insert AppTheme at the beginning of the list
                            return original.replace("import {", "import { AppTheme,")
                            
                        # This regex matches the import block, assuming single line for now
                        new_content = re.sub(r'import\s+\{([^}]*)\}\s+from\s+[\'"]\.*?/?.*?theme/colors[\'"]', replace_import, content)
                        
                        if new_content != content:
                            with open(filepath, "w", encoding="utf-8") as f:
                                f.write(new_content)
                            count += 1
                        else:
                            print(f"   [WARN] Could not inject AppTheme in {file} (Complex import?)")
                    else:
                        # File uses AppTheme but doesn't import from colors at all? 
                        # This might be valid if it's defined locally (unlikely for AppTheme)
                        # or if it's the colors.ts file itself.
                        if file != "colors.ts":
                             print(f"   [MANUAL CHECK REQ] {file} uses AppTheme but has no colors import.")

    print(f"Fixed {count} files.")

if __name__ == "__main__":
    fix_files()
