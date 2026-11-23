import { taskList } from './journey-content.js';
import { practiceFor } from './growth.js';

export function timelineFor(state) {
  const { plan, projectTracker: stored } = state;
  if (!plan || (stored && stored.source !== 'plan' && stored.steps?.length)) return stored;
  const prior = new Map((stored?.steps || []).map(step => [step.id, step]));
  const steps = taskList(plan, state.planTargets || [], state.roadmap, state.growth?.confirmed).map(task => {
    const previous = prior.get(task.id);
    const sameGoal = previous?.goal === task.goal;
    const generated = {
      title: task.title, skill: task.skill, evidence: task.evidence, action: task.detail, today: task.firstAction
    };
    const current = key => sameGoal && previous.generated?.[key] === generated[key] ?
      previous[key] ?? generated[key] : generated[key];
    return {
      id: task.id, days: task.days, goal: task.goal, title: current('title'), skill: current('skill'),
      evidence: current('evidence'), action: current('action'), today: current('today'),
      generated,
      homeUndo: Boolean(sameGoal && previous?.homeUndo),
      done: Boolean((!previous || sameGoal) && (state.completedActivities?.[task.id] ?? previous?.done)),
      notes: (!previous || sameGoal) ? (state.activityNotes?.[task.id] ?? previous?.notes ?? '') : ''
    };
  }).sort((a, b) => a.days[0] - b.days[0]);
  return {
    ...stored, source: 'plan', started: stored?.started || state.started,
    focus: state.roadmap?.skill || state.planTargets?.[0]?.skill || state.growth?.confirmed?.skill || '',
    second: state.planTargets?.[1]?.skill || state.roadmap?.secondSkill || stored?.second || '', steps
  };
}

export function withTimeline(state, tracker) {
  if (tracker.steps?.some(step => step.homeUndo && !step.done)) {
    tracker = { ...tracker, steps: tracker.steps.map(step =>
      step.homeUndo && !step.done ? { ...step, homeUndo: false } : step) };
  }
  if (tracker.source !== 'plan') return { ...state, projectTracker: tracker };
  const completedActivities = { ...state.completedActivities };
  const activityNotes = { ...state.activityNotes };
  for (const step of tracker.steps) {
    completedActivities[step.id] = step.done;
    activityNotes[step.id] = step.notes;
  }
  return { ...state, projectTracker: tracker, completedActivities, activityNotes };
}

export function projectTracker({read,save,node,button,notify,aiDraft}) {
  const root = node('section','','hub-panel project-tracker');
  function fold(label) {
    const el=node('details','','follow-up'); el.append(node('summary',label)); return el;
  }
  function field(parent,label,value='',required=false) {
    const wrap=node('label',label), input=node('textarea');
    input.rows=2; input.value=value; input.required=required;
    wrap.append(input); parent.append(wrap); return input;
  }
  function render() {
    const state=read(), plan=state.plan || {}, tracker=timelineFor(state);
    root.replaceChildren(node('h2','My 90-day plan'));
    if (!tracker) {
      const setup=node('section');
      root.append(node('p',plan.goal || 'Start with where you want to be in 90 days. Choose one or two things you can practice to get there.'),setup);
      const form=node('form');
      const goal=field(form,'In 90 days, what do you want to be able to say?',plan.goal,true);
      const focus=field(form,'One specific thing to work on',state.roadmap?.skill,true);
      focus.placeholder='Getting more face time with leadership';
      const optional=fold('Add an optional focus or first exercise');
      const second=field(optional,'A second focus, if it helps');
      const first=field(optional,'Your first exercise (optional)',plan.action);
      form.append(node('button','Build my timeline'),optional); setup.append(form);
      form.onsubmit=e=>{
        e.preventDefault();
        if (!goal.value.trim() || !focus.value.trim()) return notify('Add an outcome and one focus.');
        const current=read(), goalText=goal.value.trim(), skill=focus.value.trim();
        const nextPlan = { goal: goalText, action: first.value.trim() || practiceFor(skill).practice,
          tracker: 'One concrete example of progress', prompt: 'What changed after you tried it?' };
        const started = current.started || new Date().toISOString();
        const next = { ...current, started, plan: nextPlan,
          roadmap: { ...current.roadmap, skill, secondSkill: second.value.trim() } };
        if (save(withTimeline(next, timelineFor(next)))) render();
      };
      return;
    }
    const display=()=>{render();root.querySelector('h2').tabIndex=-1;root.querySelector('h2').focus();};
    const put=(patch)=>{const s=read();return save(withTimeline(s, { ...timelineFor(s), ...patch }));};
    root.append(node('h3',plan.goal),node('p',[tracker.focus,tracker.second].filter(Boolean).join(' · ')));
    const current=tracker.steps.findIndex(s=>!s.done);
    const progress=node('progress');progress.max=tracker.steps.length;progress.value=tracker.steps.filter(s=>s.done).length;
    progress.setAttribute('aria-label','Completed milestones');
    root.append(progress,node('p',progress.value+' of '+progress.max+' milestones complete'));
    const evidence=[['90-day outcome',plan.goal],['Focus',tracker.focus],['Second focus',tracker.second]];
    tracker.steps.forEach((step,i)=>{
      const when=step.days.map(n=>{const d=new Date(tracker.started);d.setDate(d.getDate()+n-1);return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});}).join(' – ');
      const card=fold((step.done?'✓ ':i===current?'Up next · ':'')+when+' · '+step.title);
      card.classList.add('milestone');card.open=i===current;
      card.append(node('p',step.action,'activity-steps'),node('strong','What I can do today'),node('p',step.today));
      if (step.evidence) card.append(node('p', 'Evidence to look for · ' + step.evidence));
      const edit=fold('Capture feedback or adjust this exercise');
      const form=node('form'), action=field(form,'The exercise',step.action,true), today=field(form,'One action I control today',step.today,true);
      const notes=field(form,'What happened? Capture feedback, ideas, or anything that got in the way.',step.notes);
      const Speech=window.SpeechRecognition || window.webkitSpeechRecognition;
      if(Speech){
        const mic=button('Dictate a note',()=>{
          const rec=new Speech();rec.lang=navigator.language;rec.interimResults=false;
          rec.onresult=e=>{notes.value=[notes.value,e.results[0][0].transcript].filter(Boolean).join(' ');};
          rec.onend=()=>{mic.disabled=false;};rec.onerror=()=>notify('Dictation stopped. You can type or use keyboard dictation.');
          try{rec.start();mic.disabled=true;}catch{notify('Use your keyboard’s dictation or type your note.');}
        },'quiet');mic.type='button';form.append(mic);
      }else form.append(node('small','Type here or use your device’s keyboard dictation.'));
      const next=tracker.steps[i+1];
      const adjustment=next && field(form,'My next exercise, adjusted for what I learned',next.action,true);
      const nextToday=next && field(form,'First action for that exercise',next.today,true);
      const saveBtn=node('button','Save changes');form.append(saveBtn);
      edit.append(form);card.append(edit);
      const complete=node('button',step.done?'Reopen milestone':'Save and complete milestone');
      complete.type='button';card.append(complete);
      function update(toggle){
        if(![action,today,...(next?[adjustment,nextToday]:[])].every(f=>f.value.trim()))return notify('Give each exercise and first action a short description.');
        const steps=timelineFor(read()).steps.map((s,j)=>j===i?{...s,action:action.value.trim(),today:today.value.trim(),notes:notes.value.trim(),done:toggle?!s.done:s.done}:next && j===i+1?{...s,action:adjustment.value.trim(),today:nextToday.value.trim()}:s);
        if(put({steps})){display();notify(toggle?'Milestone updated.':'Changes saved.');}
      }
      form.onsubmit=e=>{e.preventDefault();update(false);};complete.onclick=()=>update(true);
      root.append(card);
      evidence.push([step.title,step.action],[step.title+' · progress',step.done?'Completed':'Planned'],[step.title+' · feedback and ideas',step.notes]);
    });
    const report=fold('Read my written plan and progress');
    report.append(node('h3',plan.goal),node('p',[tracker.focus,tracker.second].filter(Boolean).join(' · ')));
    for(const s of tracker.steps)report.append(node('h4','Days '+s.days.join('–')+' · '+s.title),node('p',(s.done?'Completed. ':'Planned. ')+s.action),node('p','First action: '+s.today));
    for(const s of tracker.steps.filter(s=>s.notes))report.append(node('strong',s.title+' · notes'),node('p',s.notes));
    if(tracker.summary)report.append(node('h3','My accepted summary'),node('p',tracker.summary.overview),...tracker.summary.insights.map(v=>node('p',v)));
    root.append(report,aiDraft({title:'90-day project progress and next exercises',entries:evidence.filter(([,v])=>v),wins:[],node,button,accept:d=>{if(put({summary:d}))display();}}));
  }
  render();return root;
}
