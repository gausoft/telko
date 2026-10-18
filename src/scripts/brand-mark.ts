import type { BrandView } from '../lib/brand-types';

/** Client twin of BrandMark.astro (same classes, styles in styles/brand-mark.css). */
export function brandMarkElement(brand: BrandView, size: number): HTMLElement {
  const mark = document.createElement('span');
  mark.className = 'brand-mark';
  mark.style.setProperty('--size', `${size}px`);

  if (brand.logo) {
    mark.classList.add('brand-mark-logo');
    const img = document.createElement('img');
    img.src = brand.logo;
    img.alt = brand.name;
    img.width = size;
    img.height = size;
    mark.append(img);
  } else {
    mark.classList.add('brand-mark-badge');
    mark.setAttribute('role', 'img');
    mark.setAttribute('aria-label', brand.name);
    mark.textContent = brand.badge.label;
    mark.style.background = brand.badge.background;
    mark.style.color = brand.badge.foreground;
  }

  return mark;
}
