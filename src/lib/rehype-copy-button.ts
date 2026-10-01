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

function wrapPre(pre: HastElement): HastElement {
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
    children: [{ type: 'text', value: 'Скопировать' }],
  };

  return {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['copy-block'],
      dataCopyRoot: '',
    },
    children: [button, pre],
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
