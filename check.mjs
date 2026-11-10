import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor(tagName = 'DIV') {
    this.tagName = tagName;
    this.listeners = {};
    this.attributes = {};
    this.children = [];
    this.style = {setProperty() {}};
    this.classList = {toggle: (name, active) => { this[name] = active; }};
    this.dataset = {};
    this.hidden = false;
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(child) { this.children.push(child); }
  querySelectorAll(query) { return query === 'video' ? [this.video] : []; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  closest() { return null; }
  click() { this.listeners.click({currentTarget:this}); }
}
const html = fs.readFileSync(new URL('dist/index.html', import.meta.url), 'utf8');
const titles = [...html.matchAll(/class="slide[^\"]*" data-title="([^\"]+)"/g)].map(match => match[1]);
assert.equal(titles.length, 18);
const ids = ['deck', 'overview', 'overview-list', 'prev', 'next', 'announcement', 'fullscreen', 'overview-open', 'overview-close', 'gene-detail', 'answer-toggle', 'answer'];
const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
elements.answer.hidden = true;
const slides = titles.map(title => {
  const element = new Element();
  element.dataset.title = title;
  element.video = {paused: false, pause() { this.paused = true; }};
  return element;
});
const steps = [0,1,2].map(index => {
  const button = new Element('BUTTON');
  button.dataset.step = String(index);
  return button;
});
const listeners = {};
const document = {
  getElementById: id => elements[id],
  querySelectorAll: selector => selector === '.slide' ? slides : steps,
  createElement: tag => new Element(tag.toUpperCase()),
  addEventListener: (name, callback) => { listeners[name] = callback; },
  documentElement: {requestFullscreen: async () => { document.fullscreenElement = true; }},
  exitFullscreen: async () => { document.fullscreenElement = false; }
};
const location = {hash:''};
const context = {document, location, innerWidth:1600, innerHeight:900, history:{replaceState:(_,__,hash) => { location.hash = hash; }}, setTimeout, clearTimeout, addEventListener:(name, callback) => { listeners[name] = callback; }};
vm.runInNewContext(fs.readFileSync(new URL('dist/deck.js', import.meta.url), 'utf8'), context);
const key = (value, tagName = 'BODY') => listeners.keydown({key:value,target:{tagName},preventDefault(){}});
const active = () => slides.findIndex(slide => slide.active);
assert.equal(active(), 0);
assert.equal(elements.prev.disabled, true);
key('ArrowLeft'); assert.equal(active(), 0);
key('ArrowRight'); assert.equal(active(), 1);
assert.equal(slides[0].video.paused, true);
assert.equal(slides[0].inert, true);
key('End'); assert.equal(active(), 17);
assert.equal(elements.next.disabled, true);
key('ArrowRight'); assert.equal(active(), 17);
key('Home'); assert.equal(active(), 0);
key('9'); key('Enter'); assert.equal(active(), 8);
key('ArrowRight', 'VIDEO'); assert.equal(active(), 8);
elements['overview-open'].click(); assert.equal(elements.overview.open, true);
key('ArrowRight'); assert.equal(active(), 8);
elements['overview-list'].children[4].click(); assert.equal(active(), 4);
assert.equal(elements.overview.open, false);
steps[2].click(); assert.match(elements['gene-detail'].textContent, /тазартылады/);
assert.equal(steps[2].attributes['aria-pressed'], 'true');
elements['answer-toggle'].click(); assert.equal(elements.answer.hidden, false);
elements['answer-toggle'].click(); assert.equal(elements.answer.hidden, true);
assert.equal(location.hash, '#5');
clearTimeout(context.digitTimer);
console.log('PASS: 18 slides; navigation boundaries; jump; media pause; inert slides; dialog; gene steps; answer toggle');
