# Compact verified CRUD

For a new Vite app follow the automatic setup in [AI.md](../AI.md#import-create-mount), omit component/service lists, and import `jss:runtime` in the entrypoint. For an existing app preserve its loading method. Then run the following code with an `#app` element. Uses public field APIs; selectors below identify application-owned buttons only. Persistence failures keep the editor open. Filtering applies to names and category; five rows per page. Create fresh fields for each opening; closing an overlay cleans up its mounted content and explicitly disposes the eight caller-owned field/error rods.

```js
const _ = window._;
const key = 'jsswift-crud-example';
const categories = ['Casa', 'Ufficio'];
const priceFormat = new Intl.NumberFormat('it-IT', {style:'currency', currency:'EUR'});
const initial = () => Array.from({length: 6}, (_, i) => ({id:i+1, name:`Prodotto ${i+1}`, category:categories[i%2], price:10, quantity:2}));
const valid = rows => Array.isArray(rows) && new Set(rows.map(r => r?.id)).size === rows.length && rows.every(r => r && Number.isSafeInteger(r.id) && r.id > 0 && typeof r.name === 'string' && r.name.trim() && categories.includes(r.category) && Number.isFinite(r.price) && r.price >= 0 && Number.isSafeInteger(r.quantity) && r.quantity >= 0);
let rows = initial(), editing = null, origin = 'add-product', query = '', category = '', page = 1;
const notice = _.p({role:'status','aria-live':'polite'});
try { const stored = localStorage.getItem(key); if (stored) { const data = JSON.parse(stored); if (valid(data)) rows = data; else notice.textContent = 'Archivio non valido'; } } catch { notice.textContent = 'Archivio non disponibile'; }
let models, errors, fields, dialog, save;
function edit(record) {
 editing = record?.id ?? null; origin = record ? `edit-${record.id}` : 'add-product';
models = Object.fromEntries(['name','category','price','quantity'].map(k => [k, _.rod('')]));
errors = Object.fromEntries(Object.keys(models).map(k => [k, _.rod('')]));
const ownedModels = [...Object.values(models), ...Object.values(errors)], returnFocus = origin;
fields = {
 name: _.Input({label:'Nome', required:true, model:models.name, error:errors.name}),
 category: _.Select({label:'Categoria', required:true, model:models.category, error:errors.category, options:categories.map(value => ({value,label:value}))}),
 price: _.Input({label:'Prezzo', type:'number', required:true, min:0, step:'any', model:models.price, error:errors.price}),
 quantity: _.Input({label:'Quantità', type:'number', required:true, min:0, step:1, model:models.quantity, error:errors.quantity})
};
const saveError = _.p({role:'alert'});
dialog = _.Dialog({title:'Prodotto', ariaLabel:'Prodotto', trapFocus:true, autoFocus:true, closeOnEsc:true,
 content:_.div({}, ...Object.values(fields), saveError), onOpen:() => fields.name.focus(),
 onClose:() => { ownedModels.forEach(model => model.dispose());
 requestAnimationFrame(() => (document.getElementById(returnFocus) ?? add).focus()); }});
save = _.Button({id:'save-product', onClick:() => {
 const value = {name:models.name.value.trim(),category:models.category.value,price:Number(models.price.value),quantity:Number(models.quantity.value)};
 errors.name.value = value.name ? '' : 'Nome obbligatorio';
 errors.category.value = categories.includes(value.category) ? '' : 'Categoria obbligatoria';
 errors.price.value = String(models.price.value).trim() && Number.isFinite(value.price) && value.price >= 0 ? '' : 'Prezzo non valido';
 errors.quantity.value = String(models.quantity.value).trim() && Number.isSafeInteger(value.quantity) && value.quantity >= 0 ? '' : 'Quantità non valida';
 const invalid = Object.keys(errors).find(k => errors[k].value);
 if (invalid) { fields[invalid].focus(); return; }
 const usedIds = new Set(rows.map(r => r.id));
 let freeId = 1; while (usedIds.has(freeId)) freeId++;
 const record = {id:editing ?? freeId,...value};
 const next = editing == null ? [...rows,record] : rows.map(r => r.id === editing ? record : r);
 try { localStorage.setItem(key, JSON.stringify(next)); } catch { saveError.textContent = 'Salvataggio non riuscito'; return; }
 rows = next; renderStats(); render(); dialog.close(); notice.textContent = 'Salvato';
}}, 'Salva');
dialog.update({actions:[_.Button({onClick:() => dialog.close()},'Annulla'),save]});
 for (const k of Object.keys(models)) models[k].value = String(record?.[k] ?? '');
 dialog.open();
}
const host = _.div({role:'region','aria-label':'Tabella prodotti',tabindex:0,style:{maxWidth:'100%',overflowX:'auto'}}), pager = _.div(), stats = _.div();
function renderStats() {
 const available = rows.filter(r => r.quantity > 0).length;
 _.mount(stats, [_.Kpi({title:'Prodotti totali',value:rows.length}), _.Kpi({title:'Disponibili',value:available}), _.Kpi({title:'Esauriti',value:rows.length-available}), _.Kpi({title:'Valore magazzino',value:priceFormat.format(rows.reduce((sum,r) => sum+r.price*r.quantity,0))})]);
}
function changePage(delta, trigger) {
 page += delta; render();
 const button = document.getElementById(trigger);
 (button.disabled ? pager : button).focus();
}
pager.tabIndex = -1;
const add = _.Button({id:'add-product',onClick:() => edit()},'Nuovo prodotto');
const search = _.Input({label:'Cerca',onInput:value => {query=value;page=1;render();}});
const filter = _.Select({label:'Filtro categoria',options:[{value:'',label:'Tutte'},...categories.map(value => ({value,label:value}))],onChange:value => {category=value;page=1;render();}});
function render() {
 const found = rows.filter(r => r.name.toLowerCase().includes(query.trim().toLowerCase()) && (!category || r.category === category));
 const pages = Math.max(1,Math.ceil(found.length/5)); page = Math.min(page,pages);
 _.mount(host, _.Table({rows:found.slice((page-1)*5,page*5),rowKey:'id',embedded:true,pagination:false,hideFooter:true,hideStatus:true,minTableWidth:600,shadow:'none',radius:'12px',style:{background:'#fff'},tableStyle:{background:'#fff','--set-color-1':'#fff','--jss-table-head':'#fff'},emptyText:'Nessun prodotto trovato',
 columns:[{key:'name',sortable:false,label:'Nome'},{key:'category',sortable:false,label:'Categoria'},{key:'price',sortable:false,label:'Prezzo',format:value => priceFormat.format(value)},{key:'quantity',sortable:false,label:'Quantità'},
 {key:'actions',sortable:false,label:'Azioni',render:r => _.Button({id:`edit-${r.id}`,onClick:() => edit(r)},'Modifica')}] }));
 _.mount(pager, [_.span(`${found.length} prodotti — pagina ${page}/${pages}`),
 _.Button({id:'previous',disabled:page===1,onClick:() => changePage(-1,'previous')},'Precedente'),
 _.Button({id:'next',disabled:page===pages,onClick:() => changePage(1,'next')},'Successiva')]);
}
_.mount('#app', _.div({style:{minWidth:0}}, add, stats, search, filter, host, pager, notice)); renderStats(); render();
```

Application validation remains explicit. `error` marks the control invalid; rendered field messages are associated automatically. Use `ariaDescribedBy` for additional application-owned descriptions. This example does not provide delete, server synchronization or a complete visual design.

Performance: the currency formatter is reused; KPI update only when inventory changes, not on search or pagination. This small example rebuilds its table for clarity; profile larger datasets before changing rendering strategy. `onOpen` focuses the name field and automatic focus respects that choice.

## Verification checklist

Build success alone does not verify this flow. In a browser, record these results separately:

- Open the editor and, after deferred autofocus, check that the name control is active.
- Change the category, save, reopen, and reload: check the displayed value and persisted category.
- Reject blank fields, negative price and fractional quantity; check `aria-invalid` and the field error referenced by `aria-describedby`.
- Use Tab and Shift+Tab at both dialog boundaries, Escape to close, and check focus returns to the current trigger after rendering.
- Add and edit, reload, then search, filter and paginate; check persistence and page reset.
- Reach both pagination boundaries with the keyboard: focus moves to the pager when the clicked button becomes disabled.
- At a narrow viewport, check page overflow and table scrolling. Measure contrast separately; screenshots alone do not establish contrast compliance.

The example uses public field APIs and rod values. If a browser is unavailable, report these interactions as unverified rather than deriving them from pure-logic assertions.

Table supplies its own Card and empty state. If an application adds a surrounding panel with its own border, use `embedded:true` on Table to avoid nested frames. This example disables column sorting because it supplies a page slice; sort the complete filtered data before slicing if global sorting is required. For dashboard counters prefer `_.Kpi({title, value, note})`. Preserve field input transparency and use the container height variable described in [AI guide](../AI.md#catalogue-surfaces-and-field-styling).

Lifecycle: `_.mount(host, nextContent)` clears the previous subtree through JSswift cleanup (default `clear:true`). Its returned function unmounts the new content. Use this for replacing component subtrees; native `replaceChildren`, `innerHTML` or `remove` alone do not invoke registered JSswift cleanup. Keep shared models alive until their application owner disposes them. Temporary editor models are owned by each opening and disposed in `onClose`; capture them there rather than disposing models from a later opening. New records use the first free positive ID, so a stored `Number.MAX_SAFE_INTEGER` does not cause unsafe IDs.
