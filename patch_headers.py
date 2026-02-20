import os

# Constants
USER_PROFILE = os.environ.get('USERPROFILE', '')
GRADLE_CACHE_DIR = os.path.join(USER_PROFILE, '.gradle', 'caches')
FILE_PATTERN = 'graphicsConversions.h'

# Target variations to fix
TARGETS = [
    'return std::format("{}%", dimension.value);',
    'return folly::format("{}%", dimension.value);',
    'return folly::format("{}%", dimension.value).str();'
]

# The Safe Replacement
REPLACEMENT = 'return std::to_string(dimension.value) + "%"; // Patched by Antigravity'

def patch_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        modified = False
        new_content = content

        for target in TARGETS:
            if target in new_content:
                print(f"   🎯 Found target: {target}")
                new_content = new_content.replace(target, REPLACEMENT)
                modified = True

        # Fallback regex-like check (if spaces differ)
        if not modified:
            # Check for loose "format" and "dimension.value" in same line
            lines = new_content.split('\n')
            for i, line in enumerate(lines):
                if ('format' in line and 'dimension.value' in line and 'return' in line):
                    print(f"   ⚠️ Found suspicious line: {line.strip()}")
                    print(f"   🛠️ Forcing replacement on line {i+1}")
                    lines[i] = REPLACEMENT
                    new_content = '\n'.join(lines)
                    modified = True
                    break

        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print("   ✅ Saved.")
            return True
        else:
            return False

    except Exception as e:
        print(f"❌ Error reading/writing {file_path}: {e}")
        return False

def main():
    print(f"🔍 Searching for {FILE_PATTERN} in {GRADLE_CACHE_DIR}...")
    
    found_count = 0
    patched_count = 0

    # Walk through the entire Gradle cache directory
    for root, dirs, files in os.walk(GRADLE_CACHE_DIR):
        if FILE_PATTERN in files:
            full_path = os.path.join(root, FILE_PATTERN)
            print(f"📄 Checking: {full_path}")
            found_count += 1
            
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                new_content = content
                modified = False

                # Split by lines to handle formatting differences
                lines = new_content.split('\n')
                for i, line in enumerate(lines):
                    # Check for the problematic line with loose matching
                    if 'format' in line and 'dimension.value' in line and 'return' in line:
                         # Ensure we don't patch already patched lines
                        if 'Patched by Antigravity' not in line:
                            print(f"   🎯 Found target on line {i+1}: {line.strip()}")
                            lines[i] = REPLACEMENT
                            modified = True

                if modified:
                    new_content = '\n'.join(lines)
                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print("   ✅ Saved.")
                    patched_count += 1
                else:
                    print("   ℹ️ No changes needed.")

            except Exception as e:
                print(f"❌ Error processing {full_path}: {e}")

    if found_count == 0:
        print("⚠️ No valid files found in cache.")
    else:
        print(f"✅ Found {found_count} files. Patched {patched_count} files.")

if __name__ == "__main__":
    main()
