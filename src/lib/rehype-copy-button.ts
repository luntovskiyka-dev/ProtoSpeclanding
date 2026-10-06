interface HastText {
  type: 'text';
  value: string;
}

interface HastElement {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
}

interface HastParent {
  type: string;
  children?: HastNode[];
}

type HastNode = HastElement | HastText | HastParent;

function isElement(node: HastNode): node is HastElement {
  return node.type === 'element' && 'tagName' in node;
}

function isParent(node: HastNode): node is HastParent {
  return Array.isArray((node as HastParent).children);
}

function langFromPre(pre: HastElement): string {
  const className = pre.properties.className;
  const classes = Array.isArray(className)
    ? className.map(String)
    : typeof className === 'string'
      ? className.split(/\s+/)
      : [];
  for (const child of pre.children) {
    if (!isElement(child) || child.tagName !== 'code') continue;
    const codeClass = child.properties.className;
    const codeClasses = Array.isArray(codeClass)
      ? codeClass.map(String)
      : typeof codeClass === 'string'
        ? codeClass.split(/\s+/)
        : [];
    classes.push(...codeClasses);
  }
  const lang = classes.find((name) => name.startsWith('language-'))?.slice('language-'.length);
  return lang || 'код';
}

function wrapPre(pre: HastElement): HastElement {
  const filename = langFromPre(pre);

  const button: HastElement = {
    type: 'element',
    tagName: 'button',
    properties: {
      type: 'button',
      className: ['copy-button'],
      dataCopy: '',
      ariaLabel: 'Скопировать',
      ariaLive: 'polite',
    },
    children: [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['copy-idle'] },
        children: [{ type: 'text', value: 'Скопировать' }],
      },
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['copy-done'], hidden: true },
        children: [{ type: 'text', value: '✓ Скопировано' }],
      },
    ],
  };

  const toolbar: HastElement = {
    type: 'element',
    tagName: 'div',
    properties: { className: ['copy-toolbar'] },
    children: [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['copy-filename'] },
        children: [{ type: 'text', value: filename }],
      },
      button,
    ],
  };

  return {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['copy-block'],
      dataCopyRoot: '',
    },
    children: [toolbar, pre],
  };
}

function transform(node: HastParent): void {
  if (!node.children) return;

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index];
    if (!child) continue;
    if (isElement(child) && child.tagName === 'pre') {
      node.children[index] = wrapPre(child);
      continue;
    }
    if (isParent(child)) transform(child);
  }
}

/** Wraps fenced code blocks with a server-rendered copy button. */
export function rehypeCopyButton() {
  return (tree: HastParent) => {
    transform(tree);
  };
}
