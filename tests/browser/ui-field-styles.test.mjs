import test from 'node:test';
import postcss from 'postcss';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { buildConfiguredRuntime } from '../../tools/build-configured-runtime.mjs';

const chrome = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome'].filter(Boolean).find(existsSync);

test('UI field sizes, effects and Select menus stay consistent in both themes and full/selective builds', { skip: !chrome }, async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-button-style-'));
  try {
    for (const all of [true, false]) {
      const output = path.join(directory, all ? 'full' : 'selected');
      await buildConfiguredRuntime({ui: all ? {all:true,responsive:false} : {components:['Button','Input','Select'],responsive:false}}, output);
      const runtime = await fs.readFile(path.join(output, 'runtime.js'), 'utf8');
      const hoverRules = [];
      postcss.parse(await fs.readFile(path.join(output,'css/runtime.css'),'utf8')).walkRules(rule => {
        const selectors = postcss.list.comma(rule.selector).filter(selector => selector.includes(':hover'));
        if (selectors.length) hoverRules.push(rule.clone({selector:selectors.join(',').replaceAll(':hover','.test-hover')}).toString());
      });
      const hoverCSS = hoverRules.join('\n');
      const file = path.join(directory, 'index.html');
      await fs.writeFile(file, `<!doctype html><link rel="stylesheet" href="./${all ? 'full' : 'selected'}/css/runtime.css"><style>${hoverCSS} *{transition:none!important}</style><script type="module">
        try {
          ${runtime}
          const sizes = ['xs','sm','md','lg','xl',20];
          const buttons = sizes.map(size => _.Button({label:String(size),size}));
          const outline = _.Button({color:'dark',outline:true,label:'dark'});
          const dense = _.Button({color:'dark',outline:true,dense:true,label:'dense'});
          const light = _.Button({color:'light',outline:true,label:'light'});
          const lightDense = _.Button({color:'light',outline:true,dense:true,label:'light dense'});
          const reference = document.createElement('span');
          reference.style.color = 'var(--jss-text)';
          document.body.append(...buttons,outline,dense,light,lightDense,reference);
          const glassButtons = ['primary','secondary','warning','danger','success','info','light','dark'].flatMap(color => [false,true].map(outline => _.Button({color,glass:true,outline,label:color})));
          document.body.append(...glassButtons);
          const fields = ['secondary','dark'].map(color => _.Input({color,label:color,value:'Test',clearable:true}));
          document.body.append(...fields);
          const gradientFields = ['primary','secondary','warning','danger','success','info','light','dark'].flatMap(color => [false,true].map(outline => _.Input({color,outline,textGradient:true,label:color,value:'Gradient',clearable:true})));
          document.body.append(...gradientFields);
          const glassFields = ['primary','secondary','warning','danger','success','info','light','dark'].flatMap(color => [false,true].map(outline => _.Input({color,outline,glass:true,label:color,value:'Glass',clearable:true})));
          document.body.append(...glassFields);
          const surfaceGradients = ['primary','secondary','warning','danger','success','info','light','dark'].map(color => _.Input({color,gradient:true,label:color,value:'Gradient',clearable:true}));
          document.body.append(...surfaceGradients);
          const glowFields = ['primary','secondary','warning','danger','success','info','light','dark'].flatMap(color => [false,true].map(outline => _.Input({color,outline,glow:true,label:color,value:'Glow',clearable:true})));
          document.body.append(...glowFields);
          const sizedFields = ['xs','sm','md','lg','xl',20].map(size => _.Input({size,label:'Size',value:'Test',clearable:true}));
          document.body.append(...sizedFields);
          const densityFields = ['xs','md','xl',20].map(size => [_.Input({size,label:'Default',value:'Test'}),_.Input({size,dense:true,label:'Dense',value:'Test',clearable:true}),_.Input({size,flat:true,label:'Flat',value:'Test',clearable:true}),_.Input({size,dense:true,flat:true,label:'Dense Flat',value:'Test',clearable:true})]);
          document.body.append(...densityFields.flat());
          const lightSelect = _.Select({color:'light',label:'Light',options:[{label:'Roma',value:'roma'},{label:'Milano',value:'milano'},{label:'Disabled',value:'disabled',disabled:true}],value:'roma',filterable:true});
          document.body.append(lightSelect);
          const glossyFields = ['primary','secondary','warning','danger','success','info','light','dark'].flatMap(color => [false,true].flatMap(outline => [_.Input({color,outline,glossy:true,label:color,value:'Glossy',clearable:true}),_.Select({color,outline,glossy:true,label:color,value:'roma',clearable:true,options:[{label:'Roma',value:'roma'}]})]));
          document.body.append(...glossyFields);
          const glassSelects = ['primary','secondary','warning','danger','success','info','light','dark'].map(color => _.Select({color,glass:true,label:color,filterable:true,value:'roma',options:[{label:'Roma',value:'roma'},{label:'Milano',value:'milano'}]}));
          document.body.append(...glassSelects);
          const outlineGlossySelects = ['primary','secondary','warning','danger','success','info','light','dark'].map(color => _.Select({color,outline:true,glossy:true,label:color,value:'roma',options:[{label:'Roma',value:'roma'},{label:'Milano',value:'milano'}]}));
          document.body.append(...outlineGlossySelects);
          const outlineGlowSelects = ['primary','secondary','warning','danger','success','info','light','dark'].map(color=>_.Select({color,outline:true,glow:true,label:color,value:'roma',options:[{label:'Roma',value:'roma'}]}));
          document.body.append(...outlineGlowSelects);
          const denseSelects = ['xs','md','xl',20].map(size => [_.Select({size,label:'Default',value:'roma',clearable:true,options:['roma','milano']}),_.Select({size,dense:true,label:'Dense',value:'roma',clearable:true,options:['roma','milano']})]);
          document.body.append(...denseSelects.flat());
          const modes = [];
          for (const mode of ['light','dark']) {
            document.documentElement.setAttribute('data-theme',mode);
            for (const [normal,dense] of denseSelects) {
              const control = dense.querySelector('.jss-select-control');
              if (dense.querySelector('.jss-control').getBoundingClientRect().height >= normal.querySelector('.jss-control').getBoundingClientRect().height) throw new Error('Dense Select is not compact');
              if (getComputedStyle(control).fontSize !== getComputedStyle(normal.querySelector('.jss-select-control')).fontSize) throw new Error('Dense Select changes font size');
              const label = dense.querySelector('.jss-float-label');
              const value = dense.querySelector('.jss-select-value');
              if (value.getBoundingClientRect().top < label.getBoundingClientRect().bottom) throw new Error('Dense Select value overlaps label');
            }
            for (const select of outlineGlowSelects) {
              const shadow = getComputedStyle(select.querySelector('.jss-control')).boxShadow;
              if (!shadow.includes('inset') || !shadow.includes(mode === 'dark' ? '12px' : '10px')) throw new Error('Select Outline Glow inner light missing');
            }
            for (const select of outlineGlossySelects) {
              select.querySelector('.jss-select-control').click();
              const menu = document.querySelector('.jss-select-menu.portal');
              for (const option of menu.querySelectorAll('.jss-select-option')) {
                option.classList.add('test-hover');
                if (getComputedStyle(option).color !== getComputedStyle(reference).color) throw new Error('Outline Glossy hover text unreadable');
                if (!getComputedStyle(option).backgroundImage.includes('linear-gradient')) throw new Error('Outline Glossy reflection missing');
                option.classList.remove('test-hover');
              }
              select.querySelector('.jss-select-control').click();
            }
            for (const select of glassSelects) {
              select.querySelector('.jss-select-control').click();
              const menu = document.querySelector('.jss-select-menu.portal');
              const style = getComputedStyle(menu);
              const selectedOption = menu.querySelector('.jss-select-option.selected');
              if (selectedOption) {
                const reflection = getComputedStyle(selectedOption,'::before').content;
                if (mode === 'dark' && reflection !== 'none') throw new Error('Selected option reflection covers dark menu');
                if (mode === 'light' && reflection === 'none') throw new Error('Light Glass reflection removed');
              }
              if (style.backdropFilter !== 'blur(6px)' || !style.backgroundColor.includes(mode === 'dark' ? '0.72' : '0.6')) throw new Error('Glass menu transparency/blur missing: '+style.backgroundColor);
              for (const option of menu.querySelectorAll('.jss-select-option')) if (getComputedStyle(option).color !== getComputedStyle(reference).color) throw new Error('Glass option foreground unreadable');
              if (getComputedStyle(menu,'::before').backgroundImage.includes('radial-gradient')) throw new Error('Pale legacy menu reflection remains');
              select.querySelector('.jss-select-control').click();
            }
            for (const field of glossyFields) {
              const surface = getComputedStyle(field.querySelector('.jss-control'));
              if (!surface.backgroundImage.includes('48%') || !surface.backgroundImage.includes('50%')) throw new Error('Glossy reflection missing');
              const text = field.querySelector('.jss-mid > input') || field.querySelector('.jss-select-control');
              if (getComputedStyle(text).color !== getComputedStyle(field.querySelector('.jss-clear .jss-icon')).color) throw new Error('Glossy clear color mismatch '+mode+' '+field.className+' '+text.tagName+' '+getComputedStyle(text).color+' vs '+getComputedStyle(field.querySelector('.jss-clear .jss-icon')).color);
              if (getComputedStyle(text).webkitTextFillColor === 'rgba(0, 0, 0, 0)') throw new Error('Glossy text transparent');
            }
            lightSelect.querySelector('.jss-select-control').click();
            const lightMenu = document.querySelector('.jss-select-menu.portal');
            if (!lightMenu || parseFloat(getComputedStyle(lightMenu).borderTopWidth) < 1 || getComputedStyle(lightMenu).boxShadow === 'none' || getComputedStyle(lightMenu).backgroundColor === 'rgba(0, 0, 0, 0)') throw new Error('Light menu frame missing');
            for (const option of lightMenu.querySelectorAll('.jss-select-option')) if (getComputedStyle(option).color !== getComputedStyle(reference).color) throw new Error('Light menu option unreadable');
            if (getComputedStyle(lightMenu.querySelector('input')).color !== getComputedStyle(reference).color) throw new Error('Light menu search unreadable');
            lightSelect.querySelector('.jss-select-control').click();
            for (const [normal,dense,flat,both] of densityFields) {
              if (dense.querySelector('.jss-control').getBoundingClientRect().height >= normal.querySelector('.jss-control').getBoundingClientRect().height) throw new Error('Dense is not compact');
              if (getComputedStyle(dense).paddingTop !== '0px' || getComputedStyle(dense).marginTop !== '0px') throw new Error('Dense adds wrapper spacing');
              for (const field of [flat,both]) {
                const control = field.querySelector('.jss-control');
                if (parseFloat(getComputedStyle(control).borderTopWidth) !== 0 || getComputedStyle(control).boxShadow !== 'none') throw new Error('Flat retains border/shadow');
                field.focus();
                if (getComputedStyle(control).boxShadow === 'none') throw new Error('Flat focus invisible');
                field.querySelector('input').blur();
              }
            }
            const expectedFonts = ['10px','12px','14px','18px','24px','20px'];
            for (const [index, field] of sizedFields.entries()) {
              const input = getComputedStyle(field.querySelector('input'));
              if (input.fontSize !== expectedFonts[index]) throw new Error('Input size ignored: '+expectedFonts[index]+' got '+input.fontSize);
              const height = field.querySelector('.jss-control').getBoundingClientRect().height;
              if (index > 0 && index < 5 && height <= sizedFields[index-1].querySelector('.jss-control').getBoundingClientRect().height) throw new Error('Input height does not scale');
              if (index > 0 && index < 5 && parseFloat(getComputedStyle(field.querySelector('.jss-clear .jss-icon')).fontSize) <= parseFloat(getComputedStyle(sizedFields[index-1].querySelector('.jss-clear .jss-icon')).fontSize)) throw new Error('Clear icon does not scale');
            }
            for (const field of glowFields) {
              const input = field.querySelector('input');
              const control = field.querySelector('.jss-control');
              const idle = getComputedStyle(control).boxShadow;
              if (field.classList.contains('jss-outline') && (!idle.includes('inset') || !idle.includes(mode === 'dark' ? '12px' : '10px'))) throw new Error('Outline Glow inner light missing');
              if (idle === 'none' || getComputedStyle(input).textShadow !== 'none') throw new Error('Glow halo missing or text blurred');
              if (getComputedStyle(input).color !== getComputedStyle(field.querySelector('.jss-clear .jss-icon')).color) throw new Error('Glow clear color mismatch');
              input.focus();
              if (getComputedStyle(control).boxShadow === idle) throw new Error('Glow focus does not strengthen halo');
              input.blur();
            }
            for (const field of surfaceGradients) {
              const surface = getComputedStyle(field.querySelector('.jss-control'));
              if (!surface.backgroundImage.includes('linear-gradient')) throw new Error('Gradient surface missing');
              if (surface.getPropertyValue('--jss-field-gradient-start') === surface.getPropertyValue('--jss-field-gradient-end')) throw new Error('Gradient endpoints identical');
              if (getComputedStyle(field.querySelector('input')).color !== getComputedStyle(field.querySelector('.jss-clear .jss-icon')).color) throw new Error('Gradient clear color mismatch');
            }
            if (mode === 'dark') for (const field of glassFields) {
              for (const selector of ['input','.jss-clear .jss-icon']) {
                const foreground = getComputedStyle(field.querySelector(selector));
                const expected = document.createElement('span');
                expected.style.color = foreground.getPropertyValue('--jss-glass-text');
                field.append(expected);
                if (foreground.color !== getComputedStyle(expected).color) throw new Error('Dark Glass tint missing');
                expected.remove();
              }
              const control = field.querySelector('.jss-control');
              if (getComputedStyle(control).backdropFilter !== 'blur(8px)') throw new Error('Dark Glass blur missing');
              const reflection = getComputedStyle(control,'::before');
              if (!reflection.backgroundImage.includes('linear-gradient') || !reflection.backgroundImage.includes('radial-gradient') || reflection.boxShadow === 'none') throw new Error('Glass reflections missing');
              if (getComputedStyle(control).isolation !== 'isolate') throw new Error('Glass reflection stacking is not contained');
            }
            for (const field of gradientFields) {
              if (field.classList.contains('jss-outline')) {
                if (parseFloat(getComputedStyle(field).borderTopWidth) !== 0) throw new Error('Extra field wrapper border');
                const control = getComputedStyle(field.querySelector('.jss-control'));
                if (parseFloat(control.borderTopWidth) < 1 || control.backgroundColor !== 'rgba(0, 0, 0, 0)') throw new Error('Outline control should have one border and transparent surface');
              }
              const input = getComputedStyle(field.querySelector('input'));
              if (!input.backgroundImage.includes('linear-gradient') || input.webkitTextFillColor !== 'rgba(0, 0, 0, 0)') throw new Error('Editable gradient missing: '+mode);
              for (const selector of ['.jss-float-label','.jss-clear .jss-icon']) {
                if (getComputedStyle(field.querySelector(selector)).webkitTextFillColor === 'rgba(0, 0, 0, 0)') throw new Error('Field decoration inherits transparent fill: '+mode);
              }
              if (input.caretColor !== getComputedStyle(reference).color) throw new Error('Caret is not readable: '+mode);
            }
            for (const field of fields) {
              const inputColor = getComputedStyle(field.querySelector('input')).color;
              if (getComputedStyle(field.querySelector('.jss-clear .jss-icon')).color !== inputColor) throw new Error('Clear icon does not match field text: ' + mode);
            }
            for (const button of glassButtons) {
              if (getComputedStyle(button).color !== getComputedStyle(reference).color) throw new Error('Glass label does not follow theme text: ' + mode);
              if (getComputedStyle(button).backdropFilter === 'none') throw new Error('Glass blur missing');
            }
            modes.push([getComputedStyle(outline).color,getComputedStyle(dense).color,getComputedStyle(light).color,getComputedStyle(lightDense).color,getComputedStyle(reference).color]);
            for (const button of [outline,dense,light,lightDense]) {
              const style = getComputedStyle(button);
              if (style.borderTopColor !== getComputedStyle(reference).color || parseFloat(style.borderTopWidth) < 1 || style.borderTopStyle !== 'solid') throw new Error('Outline border is missing or does not follow theme text: ' + mode);
            }
          }
          document.body.dataset.result = JSON.stringify({sizes:buttons.map(button => [getComputedStyle(button).fontSize,getComputedStyle(button.querySelector('.jss-btn-content')).fontSize]),modes});
        } catch(error) { document.body.dataset.error = error.stack; }
      </script>`);
      const {stdout} = await promisify(execFile)(chrome, ['--headless=new','--no-sandbox','--disable-gpu','--allow-file-access-from-files','--virtual-time-budget=1000','--dump-dom',pathToFileURL(file).href], {maxBuffer:4*1024*1024});
      assert.equal(stdout.match(/data-error="([^"]*)"/)?.[1], undefined);
      const match = stdout.match(/data-result="([^"]*)"/);
      assert.ok(match,stdout.slice(-3000));
      const result = JSON.parse(match[1].replaceAll('&quot;','"').replaceAll('&amp;','&'));
      assert.deepEqual(result.sizes,['10px','12px','14px','18px','24px','20px'].map(size => [size,size]));
      for(const [normal,dense,light,lightDense,reference] of result.modes) {
        assert.equal(normal,reference);
        assert.equal(dense,reference);
        assert.equal(light,reference);
        assert.equal(lightDense,reference);
      }
    }
  } finally { await fs.rm(directory,{recursive:true,force:true}); }
});
