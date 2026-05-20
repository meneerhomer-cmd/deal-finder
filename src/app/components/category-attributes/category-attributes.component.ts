import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AttrSpec {
  key: string;
  label: string;
  /** Returns the display string, or null to hide the row (silence > "n/a"). */
  format: (v: any) => string | null;
}

const titleCase = (v: any): string | null => {
  const s = String(v ?? '').trim();
  if (!s || s === 'null') return null;
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
};
const num = (suffix = '') => (v: any): string | null =>
  v === null || v === undefined || v === '' ? null : `${v}${suffix}`;
const yesOnly = (v: any): string | null => (v === true ? 'Ja' : null);
const map = (table: Record<string, string>) => (v: any): string | null => {
  const s = String(v ?? '');
  return table[s] ?? (s && s !== 'null' ? s : null);
};

const PACKAGE_NL = { bottle: 'Fles', can: 'Blik', draft: 'Vat' };
const ORIGIN_NL = { 'single-origin': 'Single origin', blend: 'Blend' };
const ECO_NL = { 'eu-ecolabel': 'EU Ecolabel', 'nordic-swan': 'Nordic Swan', none: 'Geen' };

/**
 * Per-category attribute renderer. Maps the extractor's strict per-category
 * schema (Product.categoryAttributesJson) to Dutch labels and shows only the
 * rows the shopper can act on — anything null/false is hidden, per the
 * "show what's actionable, hide what's only KNOWN" launch principle.
 */
const CONFIG: Record<string, AttrSpec[]> = {
  bier: [
    { key: 'abvPercent', label: 'Alcohol', format: num('%') },
    { key: 'style', label: 'Stijl', format: titleCase },
    { key: 'brewery', label: 'Brouwerij', format: titleCase },
    { key: 'packageType', label: 'Verpakking', format: map(PACKAGE_NL) },
  ],
  ontbijtgranen: [
    { key: 'nutriScore', label: 'Nutri-Score', format: (v) => (v ? String(v).toUpperCase() : null) },
    { key: 'sugarPer100g', label: 'Suiker', format: num(' g/100g') },
    { key: 'fiberPer100g', label: 'Vezels', format: num(' g/100g') },
    { key: 'isOrganic', label: 'Bio', format: yesOnly },
  ],
  'snoep-chocolade': [
    { key: 'cocoaPercent', label: 'Cacao', format: num('%') },
    { key: 'sugarPer100g', label: 'Suiker', format: num(' g/100g') },
    { key: 'origin', label: 'Herkomst', format: map(ORIGIN_NL) },
    { key: 'isFairTrade', label: 'Fairtrade', format: yesOnly },
  ],
  huishouden: [
    { key: 'washCount', label: 'Wasbeurten', format: num() },
    { key: 'concentrationFactor', label: 'Concentratie', format: (v) => (v ? `${v}×` : null) },
    { key: 'ecoLabel', label: 'Ecolabel', format: (v) => {
        const s = String(v ?? '');
        return (!s || s === 'none' || s === 'null') ? null : ((ECO_NL as Record<string, string>)[s] ?? s);
      } },
    { key: 'fragranceFree', label: 'Parfumvrij', format: yesOnly },
  ],
  baby: [
    { key: 'size', label: 'Maat', format: (v) => (v === null || v === undefined || v === '' ? null : `Maat ${v}`) },
    { key: 'pieceCount', label: 'Aantal', format: num(' stuks') },
    { key: 'isHypoallergenic', label: 'Hypoallergeen', format: yesOnly },
  ],
};

@Component({
  selector: 'app-category-attributes',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (rows().length > 0) {
      <div class="attr-section">
        <h3>Kenmerken</h3>
        <div class="attr-grid">
          @for (row of rows(); track row.label) {
            <div class="attr-row">
              <span class="attr-label">{{ row.label }}</span>
              <span class="attr-value">{{ row.value }}</span>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .attr-section { margin: 1rem 0; }
    h3 {
      font-family: 'Anton', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      font-size: 1rem;
      margin: 0 0 0.5rem;
      color: var(--retro-ink);
    }
    .attr-grid {
      display: flex;
      flex-direction: column;
      border-top: 1px solid var(--retro-ink-hairline);
    }
    .attr-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.75rem;
      padding: 0.45rem 0;
      border-bottom: 1px solid var(--retro-ink-hairline);
    }
    .attr-label {
      font-family: 'Space Mono', monospace;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--retro-ink-soft);
    }
    .attr-value {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 0.95rem;
      color: var(--retro-ink);
      text-align: right;
    }
  `],
})
export class CategoryAttributesComponent {
  @Input() set category(v: string | null | undefined) { this._category.set(v ?? null); }
  @Input() set attributesJson(v: string | null | undefined) { this._json.set(v ?? null); }

  private _category = signal<string | null>(null);
  private _json = signal<string | null>(null);

  rows = computed(() => {
    const cat = this._category();
    const json = this._json();
    if (!cat || !json) return [];
    const specs = CONFIG[cat];
    if (!specs) return [];
    let attrs: Record<string, any>;
    try {
      attrs = JSON.parse(json);
    } catch {
      return [];
    }
    if (!attrs || typeof attrs !== 'object') return [];
    const out: { label: string; value: string }[] = [];
    for (const spec of specs) {
      const raw = attrs[spec.key];
      if (raw === null || raw === undefined) continue;
      const value = spec.format(raw);
      if (value) out.push({ label: spec.label, value });
    }
    return out;
  });
}
