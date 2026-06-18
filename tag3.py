import docx

doc = docx.Document(r'public/template.docx')

for table in doc.tables:
    for row in table.rows:
        if len(row.cells) > 1:
            if 'PV Solar Panels' in row.cells[0].text:
                if '{serialNumbers}' not in row.cells[1].text:
                    row.cells[1].text += '\nSerials: {serialNumbers}'

doc.save(r'public/template.docx')
