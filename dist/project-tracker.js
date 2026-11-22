const periods = [[1,7],[8,14],[15,21],[22,30],[31,60],[61,90]];

export function makeSteps(plan, focus, second) {
  const career = /promot|leadership|leader visibility/i.test([plan.goal,focus,second].join(' '));
  const skill = focus || 'my chosen skill';
  const steps = career ? [
    ['Make two introductions', 'Introduce yourself to two leaders. Ask each what their team is working on.', 'Send one leader a short introduction and ask for ten minutes.'],
    ['Put one idea in front of a peer', 'Give one peer a three-minute pitch. Ask what was clear and where you lost them.', 'Choose one idea and invite one teammate to hear it.'],
    ['Check and adjust', 'Review both introductions and the peer feedback. Name one thing that helped, one blocker, and one change for next week.', 'Reread your notes and write the one change you want to test.'],
    ['Try the revised pitch', 'Present one revised idea to a teammate or friend. Ask them to repeat your main point back to you.', 'Book a ten-minute practice run with one person.'],
    ['Collaborate across teams', 'Invite one cross-functional partner to shape a small proposal. Present it together at one leadership group meeting.', 'Ask one partner which shared problem would be worth solving.'],
    ['Make the case', 'Bring two examples of impact and one piece of feedback to a promotion-readiness conversation with your manager.', 'Pick the two examples that best show your growth.']
  ] : [
    ['Try one small action', plan.action || 'Try one ten-minute practice session for ' + skill + '.', 'Put one ten-minute practice session on today’s calendar.'],
    ['Get one outside perspective', 'Show one person what you tried. Ask for one specific improvement.', 'Invite one person to give feedback.'],
    ['Check and adjust', 'Compare your first attempt with the feedback. Identify one blocker and choose one adjustment.', 'Write down the change you most want to test.'],
    ['Test the change', 'Repeat your exercise once with the adjustment. Record what changed.', 'Choose a time and place for the next attempt.'],
    ['Practice in a new setting', 'Try the skill with one new person or in a different setting. Collect one example of progress.', 'Pick the setting where this skill matters most.'],
    ['Review the evidence', 'Compare your starting point with two examples of progress. Decide what to carry forward.', 'Choose the two examples you want to keep.']
  ];
  return steps.map(([title,action,today],i)=>({title,action,today,days:periods[i],done:false}));
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
    const state=read(), plan=state.plan || {}, tracker=state.projectTracker;
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
        const steps=makeSteps({goal:goalText,action:first.value.trim()},skill,second.value.trim());
        if(first.value.trim()) steps[0].action=first.value.trim();
        const nextPlan={action:steps[0].action,tracker:'One concrete example of progress',prompt:'What changed after you tried it?',...current.plan,goal:goalText};
        const started=current.started || new Date().toISOString();
        if(save({...current,started,plan:nextPlan,projectTracker:{focus:skill,second:second.value.trim(),started,steps}})) render();
      };
      return;
    }
    const display=()=>{render();root.querySelector('h2').tabIndex=-1;root.querySelector('h2').focus();};
    const put=(patch)=>{const s=read();return save({...s,projectTracker:{...s.projectTracker,...patch}});};
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
      card.append(node('p',step.action),node('strong','What I can do today'),node('p',step.today));
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
        const steps=read().projectTracker.steps.map((s,j)=>j===i?{...s,action:action.value.trim(),today:today.value.trim(),notes:notes.value.trim(),done:toggle?!s.done:s.done}:next && j===i+1?{...s,action:adjustment.value.trim(),today:nextToday.value.trim()}:s);
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
