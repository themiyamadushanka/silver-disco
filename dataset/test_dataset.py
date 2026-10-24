import csv
from collections import Counter

def validate():
    path = "dataset/sign_language_dual_hands_dataset.csv"
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Total Rows: {len(rows)}")
    print(f"Total Columns: {len(reader.fieldnames)}")

    signs = Counter(r["sign_name"] for r in rows)
    two_handed = Counter(r["two_handed"] for r in rows)

    print("\nSigns breakdown:")
    for sign, count in sorted(signs.items()):
        print(f"  - {sign:15}: {count} samples")

    print("\nTwo-handed distribution:")
    print(f"  - One-handed: {two_handed.get('0', 0)} samples")
    print(f"  - Two-handed: {two_handed.get('1', 0)} samples")

    coord_cols = [c for c in reader.fieldnames if c.endswith(("_x", "_y", "_z"))]
    print(f"\nVerifying {len(coord_cols)} coordinate columns across all samples...")
    for idx, r in enumerate(rows):
        for col in coord_cols:
            val = r[col]
            if val is None or val == "":
                raise ValueError(f"Row {idx} has missing value for {col}")
            float(val)

    print("Quality check PASSED! 100% clean, non-null, properly formatted.")

if __name__ == "__main__":
    validate()
