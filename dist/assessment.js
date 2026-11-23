const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];
const extensions = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', txt: 'text/plain' };

async function reportTransaction(mode, operation) {
  const db = await new Promise((resolve, reject) => {
    const open = indexedDB.open('next-chapter-assessment-files', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('reports', {keyPath:'id'});
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('reports', mode);
      const request = operation(tx.objectStore('reports'));
      tx.oncomplete = () => resolve(request?.result);
      tx.onabort = () => reject(tx.error || new Error('File storage unavailable.'));
    });
  } finally { db.close(); }
}

export const clearReports = () => reportTransaction('readwrite', store => store.clear());

function readAsData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('This file could not be read.'));
    reader.readAsDataURL(file);
  });
}

export async function requestInsight(payload) {
  const response = await fetch('/api/reflection', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'AI is unavailable right now.');
  return result;
}

export function assessmentPanel({ read, save, node, button, notify }) {
  const box = node('details', '', 'follow-up assessment-panel');
  box.append(node('summary', 'Add reports or test results'),
    node('p', 'Save up to 10 original reports in this browser (2 MB each, 12 MB total). Deleting a file keeps its accepted summary and saved plans. To use them in AI questions, insights, and Roadmap suggestions, generate and accept a summary. Generating a summary sends the chosen files (up to 2 MB each) or pasted text to OpenAI.'));
  const fileLabel = node('label', 'Test results file');
  const upload = document.createElement('input');
  upload.type = 'file';
  upload.multiple = true;
  upload.accept = '.pdf,.png,.jpg,.jpeg,.txt';
  fileLabel.append(upload);
  const textLabel = node('label', 'Paste results');
  const pasted = node('textarea', '');
  pasted.maxLength = 24000;
  textLabel.append(pasted);
  const savedLabel = node('label', 'Summary to carry into questions and planning');
  const summary = node('textarea', '');
  summary.maxLength = 8000;
  summary.value = read().assessment?.summary || '';
  savedLabel.append(summary);
  const status = node('p', '', 'inline-status');
  status.setAttribute('role', 'status');
  const savedFiles = node('ul');
  const picker = node('select');
  const pickerLabel = node('label', 'Report for AI summary');
  pickerLabel.append(picker);
  let reports = [];
  async function refresh() {
    reports = await reportTransaction('readonly', store => store.getAll());
    const previous = picker.value;
    picker.replaceChildren(new Option('Select a saved report', ''));
    savedFiles.replaceChildren();
    for (const {id, file} of reports) {
      picker.add(new Option(file.name, id));
      const row = node('li');
      row.append(button(file.name, () => {
        const url = URL.createObjectURL(file);
        const link = node('a'); link.href = url; link.download = file.name; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      }, 'quiet'));
      row.append(button('Delete report', async () => {
        if (!window.confirm('Delete ' + file.name + ' from this browser? Your accepted summary and plans will be kept.')) return;
        try {
          await reportTransaction('readwrite', store => store.delete(id));
          await refresh();
          status.textContent = 'Report deleted.';
        } catch { status.textContent = 'Could not delete the report.'; }
      }, 'quiet'));
      savedFiles.append(row);
    }
    generateAll.textContent = 'Summarize all saved reports (' + reports.length + ')';
    picker.value = previous;
    pickerLabel.hidden = generateAll.hidden = !reports.length;
  }
  const submit = button('Submit test results', async () => {
    const files = Array.from(upload.files);
    if (!files.length) { status.textContent = 'Choose at least one file first.'; return; }
    if (files.some(file => !file.size || !allowed.includes(file.type || extensions[file.name.split('.').pop().toLowerCase()]))) {
      status.textContent = 'Choose nonempty PDF, PNG, JPEG, or text files.'; return;
    }
    if (files.length > 10 || files.some(file => file.size > 2 * 1024 * 1024)) {
      status.textContent = 'Choose up to 10 files, each 2 MB or less.';
      return;
    }
    submit.disabled = upload.disabled = true;
    let limitExceeded = false;
    try {
      await reportTransaction('readwrite', store => {
        const entries = files.map(file => ({id: JSON.stringify([file.name,file.size,file.lastModified]),file}));
        const current = store.getAll();
        current.onsuccess = () => {
          const sizes = new Map(current.result.map(row => [row.id,row.file.size]));
          for (const row of entries) sizes.set(row.id,row.file.size);
          if (sizes.size > 10 || [...sizes.values()].reduce((a,b) => a+b,0) > 12 * 1024 * 1024) {
            limitExceeded = true;
            store.transaction.abort();
            return;
          }
          for (const row of entries) store.put(row);
        };
      });
      upload.value = '';
      await refresh();
      status.textContent = files.length === 1 ? '1 report saved in this browser.' : files.length + ' reports saved in this browser.';
    } catch { status.textContent = limitExceeded ? 'Report storage is limited to 10 files and 12 MB. Remove a report and retry.' : 'Could not confirm the save. Check browser storage and try again.'; }
    finally { submit.disabled = upload.disabled = false; }
  });
  const draft = node('div', '');
  let latestDraft;
  function confirm(value) {
    const accepted = value.trim();
    if (!accepted) { summary.focus(); return notify('Add a summary before accepting.'); }
    if (save({ ...read(), assessment: { summary: accepted, acceptedAt: new Date().toISOString() } })) {
      summary.value = accepted;
      upload.value = '';
      pasted.value = '';
      draft.replaceChildren();
      remove.hidden = false;
      status.textContent = 'Accepted. This summary informs future AI questions, insights, and Roadmap suggestions.';
      notify('Assessment summary saved.');
    }
  }
  async function reportPayload(file) {
    const mime = file.type || extensions[file.name.split('.').at(-1).toLowerCase()];
    if (!allowed.includes(mime) || file.size > 2 * 1024 * 1024 || !file.size) {
      throw new Error('Choose supported reports no larger than 2 MB each.');
    }
    if (mime === 'text/plain') {
      const input = (await file.text()).trim();
      if (!input || input.length > 24000) throw new Error('Text reports must contain 1 to 24,000 characters.');
      return { mode: 'assessment', input };
    }
    return { mode: 'assessment', input: 'Read the attached report.', document: { mime, data: await readAsData(file) } };
  }

  async function generateDraft(files, typed = '') {
    if (files.length > 5) { status.textContent = 'Choose at most five reports per AI batch.'; return; }
    if (files.length > 1 && !window.confirm('Send ' + files.length + ' reports to OpenAI? This uses one AI request per report.')) return;
    let completed = 0;
    generate.disabled = generateAll.disabled = submit.disabled = true;
    draft.replaceChildren();
    try {
      const excerpts = [];
      const budget = Math.floor(7800 / Math.max(files.length, 1));
      async function add(payload) {
        const result = await requestInsight(payload);
        const text = [result.overview, ...result.insights].join('\n');
        excerpts.push(text.length <= budget ? text : text.slice(0, budget - 1).replace(/\s+\S*$/, '') + '…');
        completed += 1;
      }
      if (typed) {
        status.textContent = 'Reviewing the pasted results…';
        await add({ mode: 'assessment', input: typed });
      } else {
        for (const file of files) {
          status.textContent = `Reviewing report ${completed + 1} of ${files.length}…`;
          await add(await reportPayload(file));
        }
      }
      latestDraft = excerpts.join('\n\n');
      draft.replaceChildren(node('h3', 'Assessment summary to review'), node('blockquote', latestDraft, 'entry'),
        button('Accept as written', () => confirm(latestDraft)),
        button('Edit before accepting', () => { summary.value = latestDraft; summary.focus(); }, 'quiet'));
      status.textContent = 'Review and accept the summary to use it in questions, insights, and your roadmap.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      generate.disabled = generateAll.disabled = submit.disabled = false;
    }
  }

  const generate = button('Generate AI summary', async () => {
    const typed = pasted.value.trim();
    const picked = reports.find(report => report.id === picker.value)?.file;
    const files = Array.from(upload.files);
    if (!files.length && picked) files.push(picked);
    if (!typed && !files.length) { status.textContent = 'Choose files or paste your results.'; return; }
    if (typed && files.length) { status.textContent = 'Use either files or pasted results.'; return; }
    await generateDraft(files, typed);
  }, 'quiet');
  const generateAll = button('Summarize all saved reports', async () => {
    if (reports.length) await generateDraft(reports.map(({ file }) => file));
  }, 'quiet');
  const remove = button('Remove saved summary', () => {
    if (!read().assessment) return;
    if (!window.confirm('Remove this assessment summary from Next Chapter?')) return;
    const { assessment, ...current } = read();
    if (save(current)) {
      summary.value = '';
      status.textContent = 'Assessment summary removed.';
      remove.hidden = true;
    }
  }, 'quiet');
  remove.hidden = !read().assessment;
  const accept = button('Accept summary', () => { confirm(summary.value); remove.hidden = !read().assessment; });
  generateAll.hidden = true;
  box.append(fileLabel, submit, status, savedFiles, pickerLabel, textLabel, generate, generateAll, draft, savedLabel, accept, remove);
  refresh().catch(() => { status.textContent = 'Saved reports could not be loaded. Check browser storage.'; });
  return box;
}
