import os
import re

# List of targets to patch
TARGETS = [
    # 1. Gradle Cache (The one we know about)
    r"C:\Users\Save Company\.gradle\caches\8.14.3\transforms\1b69af101147d0cbba4072a9053d402d\transformed\react-android-0.81.5-debug\prefab\modules\reactnative\include\react\renderer\core\graphicsConversions.h",
    
    # 2. Local Node Modules (The one likely causing the error now)
    os.path.abspath(os.path.join(os.getcwd(), "node_modules", "react-native", "ReactCommon", "react", "renderer", "core", "graphicsConversions.h"))
]

def patch_file(file_path):
    print(f"🔍 [PYTHON] Checking: {file_path}")
    
    if not os.path.exists(file_path):
        print(f"   ⚠️ File not found. Skipping.")
        return False

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False
    
    # Check for Include
    if "#include <folly/Format.h>" not in content:
        content = "#include <folly/Format.h>\n" + content
        modified = True
        print("   ➕ Added <folly/Format.h> include")

    # Check for problematic line
    if "return std::format" in content:
        content = content.replace("return std::format", "return folly::format")
        modified = True
        print("   🔧 Replaced std::format -> folly::format")

    # Ensure .str() is present
    if "folly::format" in content and ".str()" not in content:
        # Regex to append .str() to folly::format(...);
        pattern = r'(return\s+folly::format\("[^"]+",\s*[^)]+\));'
        replacement = r'\1.str();'
        
        new_content, count = re.subn(pattern, replacement, content)
        if count > 0:
            content = new_content
            modified = True
            print(f"   🔧 Appended .str() to {count} occurrences")

    if modified:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("   💾 PATCH APPLIED SUCCESSFULLY.")
        except Exception as e:
            print(f"   ❌ Error writing file: {e}")
        return True
    else:
        print("   ✅ File seems okay (already patched).")
        return True

if __name__ == "__main__":
    print(f"Current Working Directory: {os.getcwd()}")
    for target in TARGETS:
        patch_file(target)
    
    print("\n🏁 All patch targets processed.")
