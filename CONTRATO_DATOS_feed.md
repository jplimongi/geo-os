# Contrato de datos · `feed.json` (la "tabla única" por tenant)

Este documento es el **contrato que el pipeline de Relevant debe cumplir** para cada cliente.
El core de GEO-OS **no cambia entre clientes**: solo cambia el contenido de
`public/clients/<id>/feed.json` (hoy fichero; mañana endpoint/dataset BigQuery por tenant,
cambiando únicamente `data_source` en el `config.json`).

La fuente de verdad ejecutable del contrato es [`src/feedContract.js`](src/feedContract.js):
el store lo usa para calcular `feedHealth` (validación runtime que avisa de secciones vacías)
y el módulo **Fuentes & Datos** lo muestra como cockpit de estado. Si añades/renombras una
sección, edita ese fichero y esta doc queda derivada.

## Regla de oro (no negociable)

Cada dato declara su **estado**: `real` · `cualitativo` · `pendiente`. **Nada inventado.**
Un campo sin captura va como `null` con `state: "pendiente"`, nunca con un número fabricado.
El badge de estado se renderiza en cada vista; el cockpit agrega el estado por fuente.

## Metadatos de cabecera (obligatorios)

| Campo | Tipo | Ejemplo |
|---|---|---|
| `client_id` | string | `"mahou"` |
| `period` | string `YYYY-MM` | `"2026-06"` |
| `as_of` | string `YYYY-MM-DD` | `"2026-06-25"` |
| `source` | string | `"DataForSEO/SE Ranking/BigQuery · volcado pipeline"` |

## Secciones (una por módulo)

`kind: array` → se espera lista con ≥1 item para contar como "poblada".
`kind: object` → objeto con al menos una clave de datos poblada.
`state?` → los items declaran su estado real/cualitativo/pendiente.

| Sección | kind | Módulo | state? | Forma de cada item |
|---|---|---|---|---|
| `kpis` | array | Torre de Control | sí | `{id,label,value,unit,state,hint}` |
| `visibility_by_engine` | object | Visibilidad IA | sí | `{labels[],brand[],state,note}` |
| `brand_vs_link` | array | Brand vs Link | sí | `{brand,mentions,links,state}` |
| `authority` | array | Autoridad/ORM | sí | `{domain,dr,dir,backlinks,refdomains,dofollow_pct,state}` |
| `prompts_bank` | array | Prompts & Tracking | sí | `{cluster,prompt,volume,criticidad,presence,state}` |
| `competitors` | array | Competidores | no | `{name,ai_visibility,citation_share,authority,is_brand?}` |
| `alerts` | array | Riesgo & Alertas | sí | `{severity,domain,trigger,owner,sla_h,state}` |
| `actions` | array | Action Queue (semilla) | no | `{title,origin,owner,impact,due,status}` |
| `cycle` | object | Ciclo GEO | sí | `{case,score_before,score_after,steps[],state,note}` |
| `narratives` | object | Narrativas & Claims | sí | `{layers[{layer,diagnostico,estado}],claims[{claim,status,state}]}` |
| `ga4_ai_traffic` | array | Tráfico IA (GA4) | sí | `{brand,engine,landing,sessions,state}` |
| `local_horeca` | array | Local / HORECA | sí | `{poi,gbp_score,reviews,opportunity,state}` |
| `serp` | object | AI Overview / SERP | sí | `{keyword,aio_present,aio_cites_brand,organic[],paa[],state}` |
| `agents` | array | Agentes | no | `{name,role,status,last}` |
| `training` | array | Formación | no | `{course,role,min}` |
| `reporting` | array | Reporting | no | `{cadence,artifact,owner,channel}` |
| `sources` | array | Fuentes & Datos | no | `{provider,feeds,modules[],status,last_update}` |

## Convenciones de valores enumerados

- `alerts[].severity`: `critico` · `alto` · `medio`.
- `narratives.layers[].estado`: `ok` · `medio` · `riesgo` · `critico`.
- `narratives.claims[].status`: `aprobado` · `en_revision` · `pendiente`.
- `actions[].status` / `sources[].status`: `pendiente` · `en_curso` · `hecho` (actions) · `real`/`cualitativo`/`pendiente` (sources).
- Cualquier métrica sin captura → `null` (no `0`, salvo que el `0` sea el dato real, p.ej. `citation_share: 0`).

## Validación runtime

`validateFeed(feed)` devuelve `{ ok, meta_missing[], populated_count/total, empty_sections[], sections[] }`.
No lanza excepciones: la app nunca se rompe con un feed parcial; en su lugar el cockpit
muestra qué secciones están pendientes de volcado. Así el operador **sabe** que un módulo
está vacío por falta de dato, no por un fallo.

## Alta de un cliente nuevo (recordatorio)

1. `public/clients/<nuevo>/config.json` (marca, dominios, roles).
2. `public/clients/<nuevo>/feed.json` cumpliendo este contrato (o el endpoint que lo sirva).
3. `VITE_CLIENT=<nuevo> npm run build`. **Cero cambios en el core.**
