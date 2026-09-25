const SPREADSHEET_ID = '1wA97BMi9wmJI8LbNrNFAWjyyCsbhLDcPIGntscz3MJE';
const ALLOWED_EMAILS = [
  'diogovierib@gmail.com'
];
const APORTES_SHEET = 'Aportes';
const CONFIG_SHEET = 'Configuração';

function doGet() {
  return json_({ ok: true, service: 'Meu Patrimônio API' });
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    const user = authenticate_(String(body.accessToken || ''));

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      switch (body.action) {
        case 'list': return json_({ ...listData_(), user: { name: user.name || '', email: user.email } });
        case 'add': return json_(addInvestment_(body.investment));
        case 'delete': return json_(deleteInvestment_(String(body.id || '')));
        case 'setGoal': return json_(setGoal_(Number(body.goal || 0)));
        default: return json_({ ok: false, error: 'Ação desconhecida.' });
      }
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function listData_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(APORTES_SHEET);
  const rows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues()
    : [];
  const timezone = spreadsheet.getSpreadsheetTimeZone();
  const investments = rows
    .filter(row => row[0] !== '')
    .map(row => ({
      id: String(row[0]),
      name: String(row[1] || ''),
      ticker: String(row[2] || ''),
      type: String(row[3] || ''),
      qty: Number(row[4] || 0),
      price: Number(row[5] || 0),
      fees: Number(row[6] || 0),
      date: row[7] instanceof Date ? Utilities.formatDate(row[7], timezone, 'yyyy-MM-dd') : String(row[7] || ''),
      broker: String(row[8] || ''),
    }));
  return { ok: true, investments, monthlyGoal: getGoal_(spreadsheet) };
}

function addInvestment_(investment) {
  if (!investment || !investment.name || !investment.type || !investment.date) {
    throw new Error('Preencha nome, categoria e data.');
  }
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(APORTES_SHEET);
  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    String(investment.name),
    String(investment.ticker || '').toUpperCase(),
    String(investment.type),
    Number(investment.qty || 0),
    Number(investment.price || 0),
    Number(investment.fees || 0),
    new Date(String(investment.date) + 'T12:00:00'),
    String(investment.broker || ''),
    new Date(),
  ]);
  return { ok: true, id };
}

function deleteInvestment_(id) {
  if (!id) throw new Error('Identificador ausente.');
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(APORTES_SHEET);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { ok: true };
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  const index = ids.findIndex(row => String(row[0]) === id);
  if (index >= 0) sheet.deleteRow(index + 2);
  return { ok: true };
}

function setGoal_(goal) {
  const safeGoal = Math.max(0, Number(goal || 0));
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CONFIG_SHEET);
  sheet.getRange('B2').setValue(safeGoal);
  return { ok: true, monthlyGoal: safeGoal };
}

function getGoal_(spreadsheet) {
  return Math.max(0, Number(spreadsheet.getSheetByName(CONFIG_SHEET).getRange('B2').getValue() || 0));
}

function authenticate_(accessToken) {
  if (!accessToken) throw new Error('Faça login com Google para continuar.');
  const response = UrlFetchApp.fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    method: 'get',
    headers: { Authorization: 'Bearer ' + accessToken },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) throw new Error('Sua sessão expirou. Entre novamente.');
  const user = JSON.parse(response.getContentText());
  const userEmail = String(user.email || '').toLowerCase();
  const isAllowed = ALLOWED_EMAILS.some(function(e) { return e.trim().toLowerCase() === userEmail; });
  if (!user.email_verified || !isAllowed) {
    throw new Error('Esta conta Google (' + (user.email || 'desconhecida') + ') não tem permissão de acesso.');
  }
  return user;
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
