# Compact verified CRUD

Load JSswift and its UI CSS, then run the following code with an `#app` element. Uses public field APIs; selectors below identify application-owned buttons only. Persistence failures keep the editor open. Filtering applies to names and category; five rows per page. Create fresh fields for each opening; closing an overlay cleans up its mounted content.

```js
const _ = window._;
const key = 'jsswift-crud-example';
const categories = ['Casa', 'Ufficio'];
const priceFormat = new Intl.NumberFormat('it-IT', {style:'currency', currency:'EUR'});
const initial = () => Array.from({length: 6}, (_, i) => ({id:i+1, name:`Prodotto ${i+1}`, category:categories[i%2], price:10, quantity:2}));
const valid = rows => Array.isArray(rows) && new Set(rows.map(r => r?.id)).size === rows.length && rows.every(r => r && Number.isSafeInteger(r.id) && r.id > 0 && typeof r.name === 'string' && r.name.trim() && categories.includes(r.category) && Number.isFinite(r.price) && r.price >= 0 && Number.isSafeInteger(r.quantity) && r.quantity >= 0);
let rows = initial(), editing = null, origin = 'add-product', query = '', category = '', page = 1;
const notice = _.p({role:'status'});
try { const stored = localStorage.getItem(key); if (stored) { const data = JSON.parse(stored); if (valid(data)) rows = data; else notice.textContent = 'Archivio non valido'; } } catch { notice.textContent = 'Archivio non disponibile'; }
let models, errors, fields, dialog, save;
function edit(record) {
 editing = record?.id ?? null; origin = record ? `edit-${record.id}` : 'add-product';
models = Object.fromEntries(['name','category','price','quantity'].map(k => [k, _.rod('')]));
errors = Object.fromEntries(Object.keys(models).map(k => [k, _.rod('')]));
fields = {
 name: _.Input({label:'Nome', required:true, model:models.name, error:errors.name}),
 category: _.Select({label:'Categoria', required:true, model:models.category, error:errors.category, options:categories.map(value => ({value,label:value}))}),
 price: _.Input({label:'Prezzo', type:'number', required:true, min:0, step:'any', model:models.price, error:errors.price}),
 quantity: _.Input({label:'Quantità', type:'number', required:true, min:0, step:1, model:models.quantity, error:errors.quantity})
};
dialog = _.Dialog({title:'Prodotto', ariaLabel:'Prodotto', trapFocus:true, autoFocus:true, closeOnEsc:true,
 content:_.div({}, ...Object.values(fields)), onOpen:() => fields.name.focus(),
 onClose:() => requestAnimationFrame(() => (document.getElementById(origin) ?? add).focus())});
save = _.Button({id:'save-product', onClick:() => {
 const value = {name:models.name.value.trim(),category:models.category.value,price:Number(models.price.value),quantity:Number(models.quantity.value)};
 errors.name.value = value.name ? '' : 'Nome obbligatorio';
 errors.category.value = categories.includes(value.category) ? '' : 'Categoria obbligatoria';
 errors.price.value = String(models.price.value).trim() && Number.isFinite(value.price) && value.price >= 0 ? '' : 'Prezzo non valido';
 errors.quantity.value = String(models.quantity.value).trim() && Number.isSafeInteger(value.quantity) && value.quantity >= 0 ? '' : 'Quantità non valida';
 const invalid = Object.keys(errors).find(k => errors[k].value);
 if (invalid) { fields[invalid].focus(); return; }
 const record = {id:editing ?? Math.max(0,...rows.map(r => r.id))+1,...value};
 const next = editing == null ? [...rows,record] : rows.map(r => r.id === editing ? record : r);
 try { localStorage.setItem(key, JSON.stringify(next)); } catch { notice.textContent = 'Salvataggio non riuscito'; return; }
 rows = next; render(); dialog.close(); notice.textContent = 'Salvato';
}}, 'Salva');
dialog.update({actions:[_.Button({onClick:() => dialog.close()},'Annulla'),save]});
 for (const k of Object.keys(models)) models[k].value = String(record?.[k] ?? '');
 dialog.open();
}
const host = _.div({style:{maxWidth:'100%',overflowX:'auto'}}), pager = _.div();
const add = _.Button({id:'add-product',onClick:() => edit()},'Nuovo prodotto');
const search = _.Input({label:'Cerca',onInput:value => {query=value;page=1;render();}});
const filter = _.Select({label:'Filtro categoria',options:[{value:'',label:'Tutte'},...categories.map(value => ({value,label:value}))],onChange:value => {category=value;page=1;render();}});
function render() {
 const found = rows.filter(r => r.name.toLowerCase().includes(query.trim().toLowerCase()) && (!category || r.category === category));
 const pages = Math.max(1,Math.ceil(found.length/5)); page = Math.min(page,pages);
 host.replaceChildren(_.Table({rows:found.slice((page-1)*5,page*5),rowKey:'id',pagination:false,hideFooter:true,hideStatus:true,minTableWidth:600,
 columns:[{key:'name',label:'Nome'},{key:'category',label:'Categoria'},{key:'price',label:'Prezzo',format:value => priceFormat.format(value)},{key:'quantity',label:'Quantità'},
 {key:'actions',label:'Azioni',render:r => _.Button({id:`edit-${r.id}`,onClick:() => edit(r)},'Modifica')}] }));
 pager.replaceChildren(_.span(`${found.length} prodotti — pagina ${page}/${pages}`),
 _.Button({id:'previous',disabled:page===1,onClick:() => {page--;render();document.getElementById('previous').focus();}},'Precedente'),
 _.Button({id:'next',disabled:page===pages,onClick:() => {page++;render();document.getElementById('next').focus();}},'Successiva'));
}
_.mount('#app', _.div({style:{minWidth:0}}, add, search, filter, host, pager, notice)); render();
```

Application validation remains explicit. `error` marks the control invalid; rendered field messages are associated automatically. Use `ariaDescribedBy` for additional application-owned descriptions. This example does not provide delete, server synchronization or a complete visual design.

Performance: the currency formatter is reused. This small example rebuilds its table for clarity; profile larger datasets before changing rendering strategy. `onOpen` focuses the name field and automatic focus respects that choice.

## Verification checklist

Build success alone does not verify this flow. In a browser, record these results separately:

- Open the editor and, after deferred autofocus, check that the name control is active.
- Change the category, save, reopen, and reload: check the displayed value and persisted category.
- Reject blank fields, negative price and fractional quantity; check `aria-invalid` and the field error referenced by `aria-describedby`.
- Use Tab and Shift+Tab at both dialog boundaries, Escape to close, and check focus returns to the current trigger after rendering.
- Add and edit, reload, then search, filter and paginate; check persistence and page reset.
- At a narrow viewport, check page overflow and table scrolling. Measure contrast separately; screenshots alone do not establish contrast compliance.

The example uses public field APIs and rod values. If a browser is unavailable, report these interactions as unverified rather than deriving them from pure-logic assertions.
