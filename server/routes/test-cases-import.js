const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const db = require('../db');
const testCasesRouter = require('./test-cases');

const { validate, SEVERITIES, STATUSES } = testCasesRouter;

const router = express.Router();

const REQUIRED_HEADERS = ['title', 'steps', 'expectedresult', 'severity'];
const HEADER_ALIASES = {
  title: 'title',
  steps: 'steps',
  expectedresult: 'expectedResult',
  severity: 'severity',
  preconditions: 'preconditions',
  status: 'status',
};
const REQUIRED_HEADER_LABELS = { expectedresult: 'expectedResult' };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

function isRowBlank(record) {
  return Object.values(record).every((v) => v === undefined || v === null || String(v).trim() === '');
}

function splitSteps(cell) {
  const raw = String(cell ?? '');
  let parts;
  if (/\r?\n/.test(raw)) {
    parts = raw.split(/\r?\n/);
  } else if (raw.includes('|')) {
    parts = raw.split('|');
  } else {
    parts = [raw];
  }
  return parts.map((s) => s.trim()).filter(Boolean);
}

function normalizeEnum(value, enumValues) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  const match = enumValues.find((e) => e.toLowerCase() === trimmed.toLowerCase());
  return match || trimmed;
}

function mapRecordToCandidate(record) {
  const candidate = {};
  for (const [originalKey, value] of Object.entries(record)) {
    const mappedKey = HEADER_ALIASES[normalizeHeader(originalKey)];
    if (!mappedKey) continue;

    if (mappedKey === 'steps') {
      candidate.steps = splitSteps(value);
    } else if (mappedKey === 'severity') {
      candidate.severity = normalizeEnum(String(value ?? '').trim(), SEVERITIES);
    } else if (mappedKey === 'status') {
      const trimmed = String(value ?? '').trim();
      candidate.status = trimmed ? normalizeEnum(trimmed, STATUSES) : undefined;
    } else if (mappedKey === 'preconditions') {
      const trimmed = String(value ?? '').trim();
      candidate.preconditions = trimmed || undefined;
    } else {
      candidate[mappedKey] = String(value ?? '').trim();
    }
  }
  return candidate;
}

function parseCsvBuffer(buffer) {
  const text = buffer.toString('utf8');

  const headerLine = text.split(/\r?\n/)[0] || '';
  let headerRecords;
  try {
    headerRecords = parse(headerLine, { bom: true, trim: true });
  } catch (err) {
    return { error: `Could not parse CSV: ${err.message}` };
  }
  const rawHeaders = headerRecords[0] || [];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  const missing = REQUIRED_HEADERS.filter((h) => !normalizedHeaders.includes(h));
  if (missing.length) {
    const friendly = missing.map((h) => REQUIRED_HEADER_LABELS[h] || h);
    return { error: `Missing required column(s): ${friendly.join(', ')}` };
  }

  let records;
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });
  } catch (err) {
    return { error: `Could not parse CSV: ${err.message}` };
  }

  return { records };
}

function handlePreviewImport(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, data: null, error: 'No file uploaded (expected field "file")' });
  }

  const nameOk = /\.csv$/i.test(req.file.originalname || '');
  if (!nameOk) {
    const mimeOk = ['text/csv', 'application/vnd.ms-excel', 'application/octet-stream', 'text/plain'].includes(
      req.file.mimetype
    );
    if (!mimeOk) {
      return res.status(400).json({ success: false, data: null, error: 'File must be a .csv file' });
    }
  }

  const { records, error } = parseCsvBuffer(req.file.buffer);
  if (error) {
    return res.status(400).json({ success: false, data: null, error });
  }

  const rows = [];
  let rowNumber = 1;
  for (const record of records) {
    rowNumber += 1;
    if (isRowBlank(record)) continue;

    const data = mapRecordToCandidate(record);
    const errors = validate(data);
    rows.push({ rowNumber, data, valid: errors.length === 0, errors });
  }

  const validCount = rows.filter((r) => r.valid).length;
  res.json({
    success: true,
    data: { rows, total: rows.length, validCount, invalidCount: rows.length - validCount },
    error: null,
  });
}

function handleCommitImport(req, res) {
  const inputRows = Array.isArray(req.body.rows) ? req.body.rows : null;
  if (!inputRows) {
    return res.status(400).json({ success: false, data: null, error: 'rows must be an array' });
  }

  const now = new Date().toISOString();
  const toInsert = [];
  const skipped = [];

  inputRows.forEach((row, index) => {
    const errors = validate(row);
    if (errors.length) {
      skipped.push({ index, errors });
    } else {
      toInsert.push(row);
    }
  });

  const insertTx = db.transaction((items) => {
    const stmt = db.prepare(
      `INSERT INTO test_cases (title, preconditions, steps, expected_result, severity, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const item of items) {
      stmt.run(
        item.title.trim(),
        item.preconditions ? item.preconditions.trim() : null,
        JSON.stringify(item.steps),
        item.expectedResult.trim(),
        item.severity,
        item.status || 'draft',
        now,
        now
      );
    }
  });

  insertTx(toInsert);

  res.status(201).json({
    success: true,
    data: { imported: toInsert.length, skipped },
    error: null,
  });
}

router.post('/preview', upload.single('file'), handlePreviewImport);
router.post('/', handleCommitImport);

module.exports = router;
