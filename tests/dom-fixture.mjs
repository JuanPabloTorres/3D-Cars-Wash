// Minimal document for geometry/interaction tests only; no raster or browser validation.
export class Element {
  ownerDocument = { defaultView: { Element } };
  style = {};
  children = [];
  parentNode = null;
  hidden = false;
  attributes = {};
  appendChild(child) {
    child.remove?.();
    this.children.push(child);
    child.parentNode = this;
    return child;
  }
  remove() {
    if (this.parentNode)
      this.parentNode.children = this.parentNode.children.filter(
        (c) => c !== this,
      );
    this.parentNode = null;
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  replaceChildren(...children) {
    for (const c of this.children) c.parentNode = null;
    this.children = [];
    children.forEach((c) => this.appendChild(c));
  }
  getContext() {
    return context;
  }
}
const context = new Proxy(
  {
    measureText: (text) => ({ width: text.length * 20 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
  },
  {
    get: (target, key) => (key in target ? target[key] : () => {}),
    set: (target, key, value) => {
      target[key] = value;
      return true;
    },
  },
);
export function installDocument() {
  globalThis.document = { createElement: () => new Element() };
  globalThis.self = globalThis;
}
