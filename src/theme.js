// Aplica el tema white-label del cliente como CSS variables.
// Todo el look del core se deriva de estas variables -> multi-cliente sin tocar componentes.
export function applyTheme(brand = {}) {
  const r = document.documentElement.style
  r.setProperty('--brand-primary', brand.primary || '#DC0019')
  r.setProperty('--brand-ink', brand.ink || '#222629')
  r.setProperty('--brand-accent', brand.accent || '#9a7400')
  r.setProperty('--brand-bg', brand.bg || '#F5F6F8')
  r.setProperty('--brand-surface', brand.surface || '#FFFFFF')
  document.title = brand.name ? `GEO-OS · ${brand.name}` : 'GEO-OS'
}
