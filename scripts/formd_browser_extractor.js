// Extracts pooled-fund, original-filing (non-amendment) Form D rows from a
// quarterly SEC Form D data-set zip, entirely client-side in a real browser
// tab on https://sec.gov -- the only way to reach these files
// programmatically, since www.sec.gov sits behind an Akamai WAF that 403s
// curl/requests even with a spoofed browser User-Agent (verified), but not
// a real browser session.
//
// Usage: paste into the devtools console (or run via an automation tool's
// javascript-eval capability) while a tab is on any sec.gov page, then:
//   await extractQuarter('https://www.sec.gov/files/structureddata/data/form-d-data-sets/2020q1_d.zip')
// returns an array of rows: [accession_number, filing_date_raw, fund_type,
// committed_capital, capital_basis_code(0=target,1=raised_to_date),
// min_investment, issuer_name, issuer_state, entity_type]
//
// Used to backfill scripts/formd_history/*.json for vintages 2020-2024;
// see scripts/export_funds.py for how those files are consumed.

async function parseFormDZip(url) {
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
  const dv = new DataView(buf.buffer);

  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('EOCD not found');
  const totalEntries = dv.getUint16(eocd + 10, true);
  let cdOffset = dv.getUint32(eocd + 16, true);

  const entries = {};
  for (let i = 0; i < totalEntries; i++) {
    if (dv.getUint32(cdOffset, true) !== 0x02014b50) throw new Error('bad central dir entry at ' + cdOffset);
    const compressionMethod = dv.getUint16(cdOffset + 10, true);
    const compressedSize = dv.getUint32(cdOffset + 20, true);
    const uncompressedSize = dv.getUint32(cdOffset + 24, true);
    const nameLen = dv.getUint16(cdOffset + 28, true);
    const extraLen = dv.getUint16(cdOffset + 30, true);
    const commentLen = dv.getUint16(cdOffset + 32, true);
    const localHeaderOffset = dv.getUint32(cdOffset + 42, true);
    const nameBytes = buf.subarray(cdOffset + 46, cdOffset + 46 + nameLen);
    const name = new TextDecoder().decode(nameBytes);
    entries[name] = { compressionMethod, compressedSize, uncompressedSize, localHeaderOffset };
    cdOffset += 46 + nameLen + extraLen + commentLen;
  }

  async function readEntry(suffix) {
    const name = Object.keys(entries).find(n => n.endsWith(suffix));
    if (!name) return null;
    const e = entries[name];
    const lh = e.localHeaderOffset;
    if (dv.getUint32(lh, true) !== 0x04034b50) throw new Error('bad local header at ' + lh);
    const lNameLen = dv.getUint16(lh + 26, true);
    const lExtraLen = dv.getUint16(lh + 28, true);
    const dataStart = lh + 30 + lNameLen + lExtraLen;
    const compressed = buf.subarray(dataStart, dataStart + e.compressedSize);
    let bytes;
    if (e.compressionMethod === 0) {
      bytes = compressed;
    } else if (e.compressionMethod === 8) {
      const ds = new DecompressionStream('deflate-raw');
      const stream = new Blob([compressed]).stream().pipeThrough(ds);
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    } else {
      throw new Error('unsupported compression method ' + e.compressionMethod);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  return readEntry;
}

function parseTsv(text) {
  const lines = text.split('\n');
  const headers = lines[0].replace(/\r$/, '').split('\t');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cells = line.replace(/\r$/, '').split('\t');
    const row = {};
    for (let j = 0; j < headers.length; j++) row[headers[j]] = cells[j];
    rows.push(row);
  }
  return rows;
}

// Mirrors clean_committed_capital() in export_funds.py exactly.
function cleanCap(offeringAmt, soldAmt) {
  const sold = soldAmt || 0;
  if (offeringAmt && offeringAmt > 0 && offeringAmt <= 30000000000) {
    if (sold <= 0 || offeringAmt / Math.max(sold, 1) <= 25) return [offeringAmt, 0];
  }
  if (sold && sold > 0) return [sold, 1];
  return [null, null];
}

async function extractQuarter(url) {
  const readEntry = await parseFormDZip(url);
  const subRows = parseTsv(await readEntry('/FORMDSUBMISSION.tsv'));
  const offRows = parseTsv(await readEntry('/OFFERING.tsv'));
  const issRows = parseTsv(await readEntry('/ISSUERS.tsv'));

  const filingDate = {};
  for (const r of subRows) filingDate[r.ACCESSIONNUMBER] = r.FILING_DATE;

  const issuer = {};
  for (const r of issRows) {
    const acc = r.ACCESSIONNUMBER;
    if (issuer[acc]) continue;
    const flag = (r.IS_PRIMARYISSUER_FLAG || '').trim().toUpperCase();
    if (flag === 'YES' || flag === 'TRUE' || flag === 'Y') {
      issuer[acc] = [r.ENTITYNAME, r.STATEORCOUNTRY, r.ENTITYTYPE];
    }
  }

  const out = [];
  for (const r of offRows) {
    // Pooled funds only, original ("D") filings only -- no cross-quarter
    // amendment-chain resolution, so committed capital reflects the
    // amount at initial filing, not any later amendment.
    if (r.ISPOOLEDINVESTMENTFUNDTYPE !== 'true' || r.ISAMENDMENT !== 'false') continue;
    const acc = r.ACCESSIONNUMBER;
    const fd = filingDate[acc];
    if (!fd) continue;
    const offAmt = r.TOTALOFFERINGAMOUNT === 'Indefinite' || r.TOTALOFFERINGAMOUNT === '' ? null : Number(r.TOTALOFFERINGAMOUNT);
    const soldAmt = r.TOTALAMOUNTSOLD === 'Indefinite' || r.TOTALAMOUNTSOLD === '' ? null : Number(r.TOTALAMOUNTSOLD);
    const [cap, basis] = cleanCap(offAmt, soldAmt);
    if (cap === null || cap < 100000 || cap > 50000000000) continue;
    const iss = issuer[acc] || [null, null, null];
    const minInv = r.MINIMUMINVESTMENTACCEPTED === '' ? null : Number(r.MINIMUMINVESTMENTACCEPTED);
    out.push([acc, fd, r.INVESTMENTFUNDTYPE || null, Math.round(cap), basis, minInv, iss[0], iss[1], iss[2]]);
  }
  return out;
}
