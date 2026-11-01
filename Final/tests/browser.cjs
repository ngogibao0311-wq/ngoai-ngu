// Runs in disposable browser contexts; never changes the user's browser data.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'browser-results');
fs.mkdirSync(output, { recursive: true });
const routes = {
  vocabulary:['learn','review','quiz','stats'],
  listening:['listening','resources:audio','resources:videos'],
  speaking:['speaking','dialogue'],
  reading:['reading','resources:grammar','resources:rules','resources:idioms','resources:differentiate','resources:classifiers','resources:coverage','resources:documents','resources:graph'],
  writing:['writing:paragraph','writing:hanzi','writing:archive','resources:sandbox','resources:tones','resources:editor'],
  settings:['settings:general','settings:data','settings:integrations','settings:advanced']
};
const report = { passed: [], errors: [], overflow: [], externalFailures: [] };
(async()=>{
 const browser = await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'msedge'});
 try {
  for (const lang of ['zh','en']) {
   const context = await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
   const page = await context.newPage();
   page.on('pageerror',e=>report.errors.push(`${lang}: ${e.message}`));
   page.on('console',m=>{if(m.type()==='error' && !m.text().includes('Failed to load resource'))report.errors.push(`${lang}: ${m.text()}`)});
   page.on('requestfailed',r=>report.externalFailures.push(r.url().split('?')[0]));
   await page.goto(`http://127.0.0.1:5174/?lang=${lang}`);
   await page.locator('#lingo-heading').waitFor();
   await page.waitForFunction(()=>document.querySelector('#statV_total')?.textContent!=='0');
   await page.screenshot({path:path.join(output,`${lang}-desktop.png`),fullPage:true});
   for (const [group,targets] of Object.entries(routes)) {
    await page.locator(`button[data-section="${group}"]`).click();
    for (const target of targets) {
     if(lang==='en' && ['writing:hanzi','resources:sandbox','resources:tones'].includes(target))continue;
     await page.locator(`[data-target="${target}"]`).click();
     const [view,tab] = target.split(':');
     assert.equal(await page.locator(`#view-${view}`).isVisible(),true,target);
     assert.equal(await page.locator('button[data-section].active').getAttribute('data-section'),group,target);
     assert.equal(await page.locator('[data-target].active').getAttribute('data-target'),target,target);
     if(tab) assert.equal(await page.locator(`#${view}-content > [data-tab-content="${tab}"]`).isVisible(),true,target);
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
     if(overflow)report.overflow.push(`${lang}:desktop:${target}`);
     report.passed.push(`${lang}: ${target}`);
    }
   }
   await page.locator('button[data-section="vocabulary"]').click();
   await page.locator('#filterHSK').selectOption('1');
   assert.equal(await page.locator('#vocabGrid>details').count(),1);
   assert.equal(await page.locator('#vocabGrid>details').getAttribute('data-level'),'1');
   await page.locator('#searchV').fill('zzzznotaword');
   await page.locator('.lingo-empty').waitFor();
   await page.locator('#searchV').fill(lang==='en'?'hello':'xin chao');
   await page.waitForFunction(()=>document.querySelectorAll('#vocabGrid [data-hanzi]').length===1);
   report.passed.push(`${lang}: level filtering, accent-insensitive search, empty search`);
   await page.locator('#searchV').fill('');
   await page.locator('#filterHSK').selectOption('all');
   await page.setViewportSize({width:390,height:844});
   await page.screenshot({path:path.join(output,`${lang}-mobile.png`),fullPage:true});
   for(const [group,targets] of Object.entries(routes)) {
    await page.locator(`button[data-section="${group}"]`).click();
    for(const target of targets) {
     if(lang==='en' && ['writing:hanzi','resources:sandbox','resources:tones'].includes(target))continue;
     await page.locator(`[data-target="${target}"]`).click();
     if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)) {
      report.overflow.push(`${lang}:mobile:${target}`);
      await page.screenshot({path:path.join(output,`${lang}-overflow-${target.replace(':','-')}.png`),fullPage:true});
     }
    }
   }
   await context.close();
  }
 } finally {await browser.close(); fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));
 assert.deepEqual(report.errors,[],'Browser runtime errors');
 assert.deepEqual(report.overflow,[],'Horizontal page overflow');
})().catch(e=>{console.error(e);process.exitCode=1;});

