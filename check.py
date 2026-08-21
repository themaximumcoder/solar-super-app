import docx

doc = docx.Document('test_output.docx')
text = ''.join(c.text for t in doc.tables for r in t.rows for c in r.cells)
print('CONTAINS MHS_TEST_123:', 'MHS_TEST_123' in text)
