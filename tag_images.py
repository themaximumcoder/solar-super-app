import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')
doc = docx.Document('src/templates/template.docx')

for i, t in enumerate(doc.tables):
    print(f"\n--- TABLE {i} ---")
    for row in t.rows:
        cells = [c.text.strip().replace('\n', ' ') for c in row.cells]
        if any(cells):
            print(" | ".join(cells))
