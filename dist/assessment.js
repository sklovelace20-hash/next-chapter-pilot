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
  box.append(node('summary', 'Add personality test results'),
    node('p', 'Choose one or more reports, then press Submit to save them in this browser. For an optional AI summary, select one saved report (up to 2 MB) or paste text. Generating a summary sends that input to OpenAI.'));
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
      savedFiles.append(row);
    }
    picker.value = previous;
    pickerLabel.hidden = !reports.length;
  }
  const submit = button('Submit test results', async () => {
    const files = Array.from(upload.files);
    if (!files.length) { status.textContent = 'Choose at least one file first.'; return; }
    if (files.some(file => !file.size || !allowed.includes(file.type || extensions[file.name.split('.').pop().toLowerCase()]))) {
      status.textContent = 'Choose nonempty PDF, PNG, JPEG, or text files.'; return;
    }
    submit.disabled = upload.disabled = true;
    try {
      await reportTransaction('readwrite', store => {
        for (const file of files) store.put({id: JSON.stringify([file.name,file.size,file.lastModified]), file});
      });
      upload.value = '';
      await refresh();
      status.textContent = files.length === 1 ? '1 report saved in this browser.' : files.length + ' reports saved in this browser.';
    } catch { status.textContent = 'Could not confirm the save. Check browser storage and try again.'; }
    finally { submit.disabled = upload.disabled = false; }
  });
  refresh().catch(() => { status.textContent = 'Saved reports could not be loaded. Check browser storage.'; });
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
      status.textContent = 'Accepted. This summary can inform your questions and plan.';
      notify('Assessment summary saved.');
    }
  }
  const generate = button('Generate AI summary', async () => {
    const typed = pasted.value.trim();
    if (upload.files.length > 1) { status.textContent = 'Submit your reports first, then select one to summarize.'; return; }
    const file = upload.files[0] || reports.find(report => report.id === picker.value)?.file;
    if (!typed && !file) { status.textContent = 'Choose a file or paste your results.'; return; }
    if (typed && file) { status.textContent = 'Use either the file or the pasted results.'; return; }
    generate.disabled = true;
    status.textContent = 'Reviewing the results…';
    try {
      const payload = { mode: 'assessment', input: typed };
      if (file) {
        const mime = file.type || extensions[file.name.split('.').at(-1).toLowerCase()];
        if (!allowed.includes(mime) || file.size > 2 * 1024 * 1024 || !file.size) throw new Error('Choose a supported file no larger than 2 MB.');
        if (mime === 'text/plain') {
          payload.input = (await file.text()).trim();
          if (!payload.input || payload.input.length > 24000) throw new Error('Paste the relevant results in 24,000 characters or fewer.');
        } else {
          payload.input = 'Read the attached assessment report.';
          payload.document = { mime, data: await readAsData(file) };
        }
      }
      const result = await requestInsight(payload);
      latestDraft = [result.overview, ...result.insights].join('\n\n');
      draft.replaceChildren(node('h3', 'Assessment summary to review'), node('blockquote', latestDraft, 'entry'),
        button('Accept as written', () => confirm(latestDraft)),
        button('Edit before accepting', () => { summary.value = latestDraft; summary.focus(); }, 'quiet'));
      status.textContent = 'Review the draft and correct anything that doesn’t fit.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      generate.disabled = false;
    }
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
  box.append(fileLabel, submit, status, savedFiles, pickerLabel, textLabel, generate, draft, savedLabel, accept, remove);
  return box;
}
