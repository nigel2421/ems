import { strFromU8, unzipSync } from 'fflate';

const parseXml = (source) => {
  const document = new DOMParser().parseFromString(source, 'application/xml');
  if (document.querySelector('parsererror')) throw new Error('The spreadsheet file is not valid Excel data.');
  return document;
};

const columnIndex = (address = '') => {
  const letters = address.match(/[A-Z]+/i)?.[0]?.toUpperCase() || 'A';
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};

const readCell = (cell, sharedStrings) => {
  const type = cell.getAttribute('t');
  if (type === 'inlineStr') return cell.getElementsByTagName('t')[0]?.textContent || '';
  const value = cell.getElementsByTagName('v')[0]?.textContent || '';
  return type === 's' ? sharedStrings[Number(value)] || '' : value;
};

const getFirstSheetPath = (files) => {
  const workbook = files['xl/workbook.xml'];
  if (!workbook) return 'xl/worksheets/sheet1.xml';
  const sheet = parseXml(strFromU8(workbook)).getElementsByTagName('sheet')[0];
  const relationId = sheet?.getAttribute('r:id') || sheet?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
  const relationships = files['xl/_rels/workbook.xml.rels'];
  if (!relationshipId || !relationships) return 'xl/worksheets/sheet1.xml';
  const relationship = [...parseXml(strFromU8(relationships)).getElementsByTagName('Relationship')]
    .find((item) => item.getAttribute('Id') === relationId);
  const target = relationship?.getAttribute('Target');
  if (!target) return 'xl/worksheets/sheet1.xml';
  if (target.startsWith('/')) return target.slice(1);
  return target.startsWith('xl/') ? target : `xl/${target.replace(/^\.\//, '')}`;
};

const parseXlsxRows = async (file) => {
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const sharedStrings = files['xl/sharedStrings.xml']
    ? [...parseXml(strFromU8(files['xl/sharedStrings.xml'])).getElementsByTagName('si')]
      .map((item) => [...item.getElementsByTagName('t')].map((node) => node.textContent || '').join(''))
    : [];
  const sheetPath = getFirstSheetPath(files);
  if (!files[sheetPath]) throw new Error('No worksheet was found in this Excel file.');
  const rows = [...parseXml(strFromU8(files[sheetPath])).getElementsByTagName('row')];
  return rows.map((row) => {
    const cells = [];
    [...row.getElementsByTagName('c')].forEach((cell) => { cells[columnIndex(cell.getAttribute('r'))] = readCell(cell, sharedStrings).trim(); });
    return cells;
  }).filter((row) => row.some(Boolean));
};

const parseCsvRows = (text) => {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
};

const normalizePhone = (value) => {
  let digits = String(value || '').trim().replace(/[\s()\-+.]/g, '').replace(/\D/g, '');
  if (digits.length === 9 && /^[17]/.test(digits)) digits = `254${digits}`;
  else if (digits.length === 10 && digits.startsWith('0')) digits = `254${digits.slice(1)}`;
  if (digits.length < 10 || digits.length > 15) return '';
  return `+${digits}`;
};

export const parseVoterContactSpreadsheet = async (file) => {
  const extension = file?.name?.split('.').pop()?.toLowerCase();
  const rows = extension === 'csv'
    ? parseCsvRows(await file.text())
    : extension === 'xlsx'
      ? await parseXlsxRows(file)
      : null;
  if (!rows) throw new Error('Upload an .xlsx or .csv file.');
  if (!rows.length) throw new Error('The spreadsheet has no contact rows.');

  const headerIndex = rows[0].findIndex((value) => /phone|mobile|msisdn|telephone|contact number/i.test(value || ''));
  const hasHeader = headerIndex >= 0;
  const phoneIndex = hasHeader ? headerIndex : 0;
  const nameIndex = hasHeader ? rows[0].findIndex((value) => /name|voter/i.test(value || '')) : 1;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const seen = new Set();
  const contacts = [];
  let invalidRows = 0;

  dataRows.forEach((row, index) => {
    const phone = normalizePhone(row[phoneIndex]);
    if (!phone) { invalidRows += 1; return; }
    if (seen.has(phone)) return;
    seen.add(phone);
    contacts.push({ id: `VOTER-${Date.now()}-${index}`, phone, name: nameIndex >= 0 ? (row[nameIndex] || '') : '' });
  });

  if (!contacts.length) throw new Error('No valid phone numbers were found. Add a Phone or Mobile column, or put phone numbers in column A.');
  return { contacts, invalidRows };
};
