const {test, expect}=require('@playwright/test');
const matrix=require('./fixtures/gearly-stress-questions.json');
const launcher='Open Gearly career guide';
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.getByRole('button',{name:launcher})).toBeVisible();
});
test('broad question stress matrix preserves intent and exact source grounding',async({page})=>{
  const results=await page.evaluate(cases=>{
    const engine=GearlyCareerEngine.create(document);
    return cases.map(({question})=>{
      const result=engine.answer(question);
      return {...result,grounded:result.sources.every(source=>document.getElementById(source.id)?.textContent.replace(/\s+/g,' ').trim().includes(source.excerpt))};
    });
  },matrix);
  results.forEach((answer,i)=>{
    const entry=matrix[i];
    expect(entry.sections,entry.question).toContain(answer.kind==='answer'?answer.context.section:answer.kind);
    expect(answer.grounded,entry.question).toBe(true);
    if(answer.kind==='answer') expect(answer.sources.length,entry.question).toBeGreaterThan(0);
    else expect(answer.sources,entry.question).toEqual([]);
  });
  const at=word=>results[matrix.findIndex(row=>row.question.includes(word))].text;
  expect(at('interviewer')).toMatch(/first month|collaborate|feedback|strong interns/i);
  expect(at('interviewer')).not.toMatch(/After the interview|Interactive Story Bank|follow-up thank-you/);
  expect(at('freeze')).toMatch(/time|panic|30–45/);
  expect(at('networking email')).toMatch(/Hi \[Name\]|conversation/);
  expect(at('decline')).toMatch(/decided to decline/);
  expect(at('accepting')).toMatch(/pleased to accept/);
  expect(at('scams')).toMatch(/gift cards|verified|banking/);
});
test('all offered follow-up questions resolve without losing the topic',async({page})=>{
  const failures=await page.evaluate(cases=>{
    const engine=GearlyCareerEngine.create(document),failures=[];
    for(const {question} of cases){
      const answer=engine.answer(question);
      if(answer.kind!=='answer')continue;
      for(const suggestion of answer.suggestions){
        const next=engine.answer(suggestion,answer.context);
        if(next.kind!=='answer'||!next.sources.length)failures.push({question,suggestion,kind:next.kind});
        if(/^(Show me an example[.]?|Tell me more[.]?)$/.test(suggestion) && next.context.section!==answer.context.section)failures.push({question,suggestion,chapter:next.context.section,expected:answer.context.section});
      }
    }
    return failures;
  },matrix);
  expect(failures).toEqual([]);
});
test('long and malformed requests stay bounded and do not corrupt follow-up state',async({page})=>{
  const report=await page.evaluate(()=>{
    const e=GearlyCareerEngine.create(document),queries=['','🤖'.repeat(3000),'\u0000'.repeat(3000),'resume '.repeat(20000),'<script>alert(1)</script>','RESUMÉ','resume unicorn waffles'];
    const start=performance.now();
    for(let i=0;i<1000;i++)e.answer(queries[i%queries.length],{section:'not-a-real-section',terms:['<script>'],excerpts:[]});
    return {ms:performance.now()-start,results:queries.map(q=>e.answer(q)),known:e.answer('What is a STAR answer?')};
  });
  expect(report.ms).toBeLessThan(15000);
  for(const answer of report.results){expect(answer.text.length).toBeLessThan(8000);expect(answer.sources.length).toBeLessThanOrEqual(4);}
  expect(report.results[6].kind).toBe('fallback');
  expect(report.known.context.section).toBe('interviews');
});
test('60-turn conversation bounds rendered history, preserves draft, and resets cleanly',async({page})=>{
  await page.getByRole('button',{name:launcher}).click();
  await page.evaluate(async()=>{
    for(let i=0;i<60;i++){
      GearlyCareer.ask(i%2?'What is a STAR answer?':'How do I write a resume bullet?');
      await new Promise(resolve=>setTimeout(resolve,5));
    }
  });
  await expect(page.locator('.cg-message')).toHaveCount(24);
  const snapshot=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('asme-career-gearly-session-v1')));
  expect(snapshot.messages).toHaveLength(24);
  await page.getByRole('textbox',{name:'Ask Gearly about the career packet'}).fill('My unfinished question');
  await page.getByRole('button',{name:'Close Gearly',exact:true}).click();
  await page.getByRole('button',{name:launcher}).click();
  await expect(page.getByRole('textbox',{name:'Ask Gearly about the career packet'})).toHaveValue('My unfinished question');
  await page.reload();
  await page.getByRole('button',{name:launcher}).click();
  await expect(page.locator('.cg-message')).toHaveCount(24);
  await page.getByRole('button',{name:'Reset conversation'}).click();
  await expect(page.locator('.cg-message')).toHaveCount(1);
  await expect(page.getByRole('textbox',{name:'Ask Gearly about the career packet'})).toHaveValue('');
});
test('short narrow and landscape viewports keep chat controls usable',async({page})=>{
  await page.getByRole('button',{name:launcher}).click();
  for(const viewport of [{width:320,height:360},{width:390,height:300},{width:844,height:390}]){
    await page.setViewportSize(viewport);
    for(const selector of ['.cg-panel','.cg-header','.cg-form','.cg-input','.cg-send']){
      const rect=await page.locator(selector).boundingBox();
      expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x+rect.width).toBeLessThanOrEqual(viewport.width+1);
      expect(rect.y+rect.height).toBeLessThanOrEqual(viewport.height+1);
    }
    expect(await page.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth)).toBe(true);
  }
});

test('blocked session storage does not prevent chat or reset',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
  await page.reload();
  await page.getByRole('button',{name:launcher}).click();
  await page.getByRole('textbox',{name:'Ask Gearly about the career packet'}).fill('What is a STAR answer?');
  await page.getByRole('button',{name:'Send question',exact:true}).click();
  await expect(page.locator('.cg-bot').last()).toContainText('Situation');
  await page.getByRole('button',{name:'Reset conversation'}).click();
  await expect(page.locator('.cg-message')).toHaveCount(1);
});
test.describe('animation lifecycle',()=>{
  test.use({serviceWorkers:'block'});
  test('wave replays infrequently, reuses its download and stops when chat opens',async({page})=>{
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.clock.install();
    let downloads=0;
    page.on('request',request=>{if(request.url().includes('gearly-centered-wave.webp'))downloads++;});
    await page.reload();
    const face=page.locator('.cg-launcher-image');
    await page.clock.fastForward(7999);
    await expect(face).toHaveAttribute('src',/gearly-centered-idle/);
    await page.clock.fastForward(4001);
    await expect(face).toHaveAttribute('src',/^blob:/);
    const first=await face.getAttribute('src');
    await page.clock.fastForward(6250);
    await expect(face).toHaveAttribute('src',/gearly-centered-idle/);
    await page.clock.fastForward(59999);
    await expect(face).toHaveAttribute('src',/gearly-centered-idle/);
    await page.clock.fastForward(30001);
    await expect(face).toHaveAttribute('src',/^blob:/);
    expect(await face.getAttribute('src')).not.toBe(first);
    expect(downloads).toBe(1);
    await page.getByRole('button',{name:launcher}).click();
    await expect(face).toHaveAttribute('src',/gearly-centered-idle/);
    await expect(page.locator('.cg-launcher')).toBeHidden();
    await page.clock.fastForward(120000);
    expect(downloads).toBe(1);
  });
});

test('long replies start where the reader can see them',async({page})=>{
  await page.setViewportSize({width:320,height:360});
  await page.getByRole('button',{name:launcher}).click();
  await page.getByRole('textbox',{name:'Ask Gearly about the career packet'}).fill('Show me a STAR example.');
  await page.getByRole('button',{name:'Send question',exact:true}).click();
  await expect(page.locator('.cg-bot').last()).toContainText('packet');
  const position=await page.locator('.cg-bot').last().evaluate(node=>{
    const feed=node.parentElement,reply=node.getBoundingClientRect(),box=feed.getBoundingClientRect();
    return {replyTop:reply.top,feedTop:box.top,replyHeight:reply.height,feedHeight:feed.clientHeight};
  });
  expect(position.replyHeight).toBeGreaterThan(position.feedHeight);
  expect(position.replyTop).toBeGreaterThanOrEqual(position.feedTop);
  expect(position.replyTop).toBeLessThan(position.feedTop+30);
});
