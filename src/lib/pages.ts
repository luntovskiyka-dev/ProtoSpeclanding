import { pagePath, parentPath, type Crumb } from './seo';

export interface NavItem {
  href: string;
  label: string;
  current: boolean;
}

export interface NavSource {
  id: string;
  data: {
    nav?: boolean;
    order?: number;
    crumb: string;
  };
}

export interface ChildSource {
  id: string;
  data: {
    h1: string;
    description: string;
    order?: number;
    inIndex?: boolean;
  };
}

export interface ChildLink {
  href: string;
  title: string;
  description: string;
}

export function navigation(pages: readonly NavSource[], currentPath: string): NavItem[] {
  return pages
    .filter((page) => page.data.nav === true)
    .sort(
      (a, b) =>
        (a.data.order ?? 0) - (b.data.order ?? 0) ||
        a.data.crumb.localeCompare(b.data.crumb, 'ru'),
    )
    .map((page) => {
      const href = pagePath(page.id);
      return {
        href,
        label: page.data.crumb,
        current: href === currentPath,
      };
    });
}

export function childLinks(pages: readonly ChildSource[], parent: string): ChildLink[] {
  return pages
    .filter((page) => {
      if (page.data.inIndex === false) return false;
      return parentPath(pagePath(page.id)) === parent;
    })
    .sort(
      (a, b) =>
        (a.data.order ?? 0) - (b.data.order ?? 0) ||
        a.data.h1.localeCompare(b.data.h1, 'ru'),
    )
    .map((page) => ({
      href: pagePath(page.id),
      title: page.data.h1,
      description: page.data.description,
    }));
}

export function breadcrumbsFor(path: string, crumbs: readonly Crumb[] | undefined): Crumb[] {
  if (path === '/') return [];
  return crumbs ? [...crumbs] : [];
}
