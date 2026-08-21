import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')
doc = docx.Document('src/templates/template.docx')

tables = doc.tables
start = max(0, len(tables) - 15)

for i in range(start, len(tables)):
    print(f"\n--- TABLE {i} ---")
    for row in tables[i].rows:
        cells = [c.text.strip().replace('\n', ' ') for c in row.cells]
        if any(cells):
            print(" | ".join(cells))
