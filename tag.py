import docx
doc = docx.Document(r'public/template.docx')
tag_map = {
    'MHS No': '{siteName}',
    'System Size Installed': '{systemSize}',
    'Start Date': '{startDate}',
    'End Date': '{endDate}',
    'PIC Onsite': '{picName}',
    'Premise Address': '{address}'
}
for table in doc.tables:
    for row in table.rows:
        for i, cell in enumerate(row.cells):
            text = cell.text.strip()
            for key, tag in tag_map.items():
                if key in text and i+1 < len(row.cells):
                    if tag not in row.cells[i+1].text:
                        row.cells[i+1].text = tag

doc.save(r'public/template.docx')
