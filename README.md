# SleepBanana Global Translations (`sleepbanana-i18n`)

Shared internationalization (i18n) repository for both **SleepBanana Browser Extension** (`locales/`) and **SleepBanana Desktop** (`desktop/`).

Every language in this repository can be installed live with one click — no store review or app rebuild required:
- **Browser Extension:** **Settings → Language → Browse GitHub** (`locales/registry.json`)
- **Desktop App:** **Settings → Appearance → Language → Community Languages** (`desktop/registry.json`)

---

## Available Languages

### Browser Extension (`locales/`, 1,643 canonical keys)

| Code | Language | Native Name | Dir | Type | Coverage | Pack |
|---|---|---|---|---|---|---|
| `en` | English | English | `ltr` | Built-in | 100% (1643/1643) | [`locales/en.json`](locales/en.json) |
| `pl` | Polish | Polski | `ltr` | Built-in | 100% (1643/1643) | [`locales/pl.json`](locales/pl.json) |
| `es` | Spanish | Español | `ltr` | Built-in | 100% (1643/1643) | [`locales/es.json`](locales/es.json) |
| `de` | German | Deutsch | `ltr` | Built-in | 100% (1643/1643) | [`locales/de.json`](locales/de.json) |
| `zh` | Chinese (Simplified) | 中文 (简体) | `ltr` | Community | 100% (1643/1643) | [`locales/zh.json`](locales/zh.json) |
| `fr` | French | Français | `ltr` | Community | 20% (321/1643) | [`locales/fr.json`](locales/fr.json) |
| `ja` | Japanese | 日本語 | `ltr` | Community | 20% (321/1643) | [`locales/ja.json`](locales/ja.json) |
| `ko` | Korean | 한국어 | `ltr` | Community | 20% (321/1643) | [`locales/ko.json`](locales/ko.json) |
| `pt` | Portuguese (Brazil) | Português (Brasil) | `ltr` | Community | 20% (321/1643) | [`locales/pt.json`](locales/pt.json) |

### Desktop App (`desktop/`, 17,364 canonical keys)

| Code | Language | Native Name | Dir | Type | Coverage | Pack |
|---|---|---|---|---|---|---|
| `en` | English | English | `ltr` | Built-in | 100% (17364/17364) | [`desktop/en.json`](desktop/en.json) |
| `es` | Spanish | Español | `ltr` | Built-in | 100% (17364/17364) | [`desktop/es.json`](desktop/es.json) |
| `fr` | French | Français | `ltr` | Built-in | 100% (17364/17364) | [`desktop/fr.json`](desktop/fr.json) |
| `ja` | Japanese | 日本語 | `ltr` | Built-in | 100% (17364/17364) | [`desktop/ja.json`](desktop/ja.json) |
| `ko` | Korean | 한국어 | `ltr` | Built-in | 100% (17364/17364) | [`desktop/ko.json`](desktop/ko.json) |
| `pt` | Portuguese (Brazil) | Português (Brasil) | `ltr` | Built-in | 100% (17364/17364) | [`desktop/pt.json`](desktop/pt.json) |
| `zh` | Chinese (Simplified) | 中文 (简体) | `ltr` | Built-in | 100% (17364/17364) | [`desktop/zh.json`](desktop/zh.json) |
| `de` | German | Deutsch | `ltr` | Community | 8% (1443/17364) | [`desktop/de.json`](desktop/de.json) |
| `pl` | Polish | Polski | `ltr` | Community | 8% (1443/17364) | [`desktop/pl.json`](desktop/pl.json) |

---

## Contribute a New Language (3 Minutes)

1. Copy [`locales/en.json`](locales/en.json) (Extension) and/or [`desktop/en.json`](desktop/en.json) (Desktop) to `<code>.json` (BCP-47 code such as `de`, `pl`, `uk`, `it`, `ar`).
2. Translate strings without translating `{placeholders}` (Extension) or `{{placeholders}}` (Desktop). Partial packs are safe — missing keys fall back to English automatically.
3. Register your locale in [`locales/registry.json`](locales/registry.json) and/or [`desktop/registry.json`](desktop/registry.json) with `"bundled": false`.
4. Validate locally and recompute coverage:
   ```bash
   node scripts/validate.mjs --update-registry
   ```

To sync built-in catalogs from the sibling repos:
```bash
node ../sleepbanana/scripts/sync-i18n-repo.mjs
node ../sleepbanana-desktop/config/scripts/sync-i18n-repo.mjs
```
