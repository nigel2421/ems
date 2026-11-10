#!/usr/bin/env python3
"""
CI-EMS Internationalization (i18n) Parity & Integrity Manager
Validates and audits bilingual dictionary parity (English <-> Kiswahili)
for the Campaign Intelligence & Election Management System (CI-EMS).

Usage:
    python scripts/i18n_manager.py --verify
    python scripts/i18n_manager.py --stats
"""

import sys
import re
import json
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
CONTEXT_FILE = WORKSPACE_ROOT / "src" / "context" / "LanguageContext.jsx"

def extract_dictionary_from_jsx(file_path: Path):
    if not file_path.exists():
        print(f"[ERROR] Context file not found at: {file_path}", file=sys.stderr)
        sys.exit(1)

    content = file_path.read_text(encoding="utf-8")

    # Match the DICTIONARY object in LanguageContext.jsx
    match = re.search(r"export const DICTIONARY\s*=\s*({[\s\S]*?});\s*\n\s*const LanguageContext", content)
    if not match:
        print("[ERROR] Could not extract DICTIONARY object from LanguageContext.jsx", file=sys.stderr)
        sys.exit(1)

    raw_dict_js = match.group(1)

    # Convert JS object syntax to valid JSON
    # 1. Quote unquoted keys like en: and sw:
    clean_js = re.sub(r'(\s*)(en|sw)(\s*):', r'\1"\2"\3:', raw_dict_js)
    # 2. Remove trailing commas before closing braces
    clean_js = re.sub(r',\s*([}\]])', r'\1', clean_js)
    # 3. Strip single-line JS comments
    clean_js = re.sub(r'//.*', '', clean_js)

    try:
        data = json.loads(clean_js)
        return data
    except Exception as exc:
        print(f"[WARN] Direct JSON parse failed ({exc}). Using regex key extractor...")
        return extract_keys_via_regex(content)

def extract_keys_via_regex(content: str):
    data = {"en": {}, "sw": {}}
    current_lang = None
    for line in content.splitlines():
        line = line.strip()
        if line.startswith("en: {"):
            current_lang = "en"
        elif line.startswith("sw: {"):
            current_lang = "sw"
        elif line.startswith("}") and current_lang:
            if line == "}" or line == "},":
                current_lang = None
        elif current_lang:
            key_val = re.match(r"'([^']+)':\s*'([^']*)'", line)
            if key_val:
                k, v = key_val.groups()
                data[current_lang][k] = v
    return data

def verify_i18n(data):
    en_keys = set(data.get("en", {}).keys())
    sw_keys = set(data.get("sw", {}).keys())

    missing_in_sw = sorted(list(en_keys - sw_keys))
    missing_in_en = sorted(list(sw_keys - en_keys))

    total_keys = len(en_keys.union(sw_keys))
    parity_keys = len(en_keys.intersection(sw_keys))
    coverage = (parity_keys / total_keys * 100) if total_keys > 0 else 100.0

    print("=" * 60)
    print("  CI-EMS BILINGUAL i18n INTEGRITY REPORT (EN <-> SW)")
    print("=" * 60)
    print(f"  Total Unique Keys:     {total_keys}")
    print(f"  English Keys:          {len(en_keys)}")
    print(f"  Kiswahili Keys:        {len(sw_keys)}")
    print(f"  Bilingual Parity:      {parity_keys}/{total_keys} ({coverage:.1f}%)")
    print("-" * 60)

    if missing_in_sw:
        print(f"[FAIL] Missing in Kiswahili ({len(missing_in_sw)} keys):")
        for k in missing_in_sw:
            print(f"   - {k}")

    if missing_in_en:
        print(f"[FAIL] Missing in English ({len(missing_in_en)} keys):")
        for k in missing_in_en:
            print(f"   - {k}")

    if not missing_in_sw and not missing_in_en:
        print("[SUCCESS] 100% Bilingual Parity Achieved! All keys synced.")
        print("=" * 60)
        return True

    print("=" * 60)
    return False

def print_stats(data):
    en_dict = data.get("en", {})
    sw_dict = data.get("sw", {})
    print(f"English Vocabulary Size:    {len(en_dict)} terms")
    print(f"Kiswahili Vocabulary Size:  {len(sw_dict)} terms")
    categories = {}
    for k in en_dict:
        cat = k.split('.')[0] if '.' in k else 'general'
        categories[cat] = categories.get(cat, 0) + 1
    print("\nTerms by Category:")
    for cat, count in sorted(categories.items()):
        print(f"  - {cat.upper():<20}: {count} terms")

def main():
    dict_data = extract_dictionary_from_jsx(CONTEXT_FILE)

    if "--stats" in sys.argv:
        print_stats(dict_data)
        sys.exit(0)

    is_valid = verify_i18n(dict_data)
    sys.exit(0 if is_valid else 1)

if __name__ == "__main__":
    main()
