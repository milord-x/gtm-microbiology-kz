import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor(tagName = 'DIV') {
    this.tagName = tagName;
    this.listeners = {};
    this.attributes = {};
    this.style = {setProperty() {}};
    this.classList = {toggle: (name, active) => { this[name] = active; }};
    this.dataset = {};
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  querySelectorAll(query) { return query === 'video' ? [this.video] : []; }
  closest() { return null; }
  click() { this.listeners.click({currentTarget:this}); }
}
const html = fs.readFileSync(new URL('dist/index.html', import.meta.url), 'utf8');
const sections = [...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(match => match[0]);
assert.equal(sections.length, 14);
sections.forEach((section, index) => assert.match(section, new RegExp('class="slide-number" aria-hidden="true">' + (index + 1) + '</span>')));
assert.match(sections[4], /class="insulin-scene photo-animation"/);
assert.match(sections[6], /class="petase-scene photo-animation"/);
assert.equal((html.match(/<img[^>]+src="assets\/kaznu-emblem.png"/g) || []).length, 1);
assert.match(sections[0], /assets\/kaznu-emblem.png/);
assert.ok(!/<footer|<svg|<dialog/.test(html));
assert.match(sections[6], /Мақаланы ашу/);
assert.match(sections[13], /Шығаева.*Жұбанова.*Lu H\./s);
const elements = Object.fromEntries(['deck', 'announcement', 'bio-pause', 'bio-animation'].map(id => [id, new Element()]));
const slides = sections.map(section => {
  const element = new Element();
  element.dataset.title = section.match(/data-title="([^\"]+)"/)[1];
  element.video = {paused:false, pause() { this.paused = true; }};
  return element;
});
const listeners = {};
const document = {
  getElementById: id => elements[id],
  querySelectorAll: selector => selector === '.slide' ? slides : [],
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
key('ArrowLeft'); assert.equal(active(), 0);
key('ArrowRight'); assert.equal(active(), 1);
assert.equal(slides[0].video.paused, true);
assert.equal(slides[0].inert, true);
key('End'); assert.equal(active(), 13);
key('ArrowRight'); assert.equal(active(), 13);
key('Home'); assert.equal(active(), 0);
key('8'); key('Enter'); assert.equal(active(), 7);
key('ArrowRight', 'VIDEO'); assert.equal(active(), 7);
elements['bio-pause'].click();
assert.equal(elements['bio-animation'].paused, true);
assert.equal(elements['bio-pause'].attributes['aria-pressed'], 'true');
elements['bio-pause'].click(); assert.equal(elements['bio-animation'].paused, false);
elements.deck.listeners.touchstart({target:{closest:() => null},changedTouches:[{clientX:300,clientY:100}]});
elements.deck.listeners.touchend({changedTouches:[{clientX:100,clientY:105}]});
assert.equal(active(), 8);
location.hash = '#14'; listeners.hashchange(); assert.equal(active(), 13);
location.hash = '#invalid'; listeners.hashchange(); assert.equal(active(), 13);
key('f'); assert.equal(document.fullscreenElement, true);
console.log('PASS: 14 slides; cover-only logo; no footer/drawn organisms; article; KazNU books first; keyboard, swipe, video pause, animation pause');
