#!/usr/bin/env node
/**
 * SleepBanana Global Community i18n Validator & Registry Sync
 * Validates BOTH:
 *   - locales/  (Browser Extension flat packs, {var} placeholders)
 *   - desktop/  (Desktop nested i18next packs, {{var}} placeholders)
 *
 * Usage:
 *   node scripts/validate.mjs                   # Validate all Extension + Desktop packs
 *   node scripts/validate.mjs --update-registry # Recompute coveragePct & translatedKeys in both registries
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const updateRegistry = process.argv.includes('--update-registry')

function extractSingleBraces(str) {
  const found = new Set()
  const re = /\{([a-zA-Z0-9_]+)\}/g
  let m
  while ((m = re.exec(str)) !== null) found.add(m[1])
  return Array.from(found).sort()
}

function extractDoubleBraces(str) {
  const found = new Set()
  const re = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g
  let m
  while ((m = re.exec(str)) !== null) found.add(m[1])
  return Array.from(found).sort()
}

function flattenNested(obj, prefix = '', out = {}) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenNested(v, key, out)
    } else if (typeof v === 'string') {
      out[key] = v
    }
  }
  return out
}

function validateExtensionPacks() {
  const localesDir = resolve(repoRoot, 'locales')
  const enPath = resolve(localesDir, 'en.json')
  const registryPath = resolve(localesDir, 'registry.json')

  const enData = JSON.parse(readFileSync(enPath, 'utf8'))
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  const enMessages = enData.messages ?? {}
  const enKeys = Object.keys(enMessages)

  const files = readdirSync(localesDir)
    .filter((f) => f.endsWith('.json') && f !== 'registry.json')
    .sort()

  let hasErrors = false
  const summaryRows = []
  const registryEntries = Array.isArray(registry.locales) ? registry.locales : []
  const registryMap = new Map(registryEntries.map((l) => [l.code, l]))

  for (const file of files) {
    const fullPath = resolve(localesDir, file)
    const raw = JSON.parse(readFileSync(fullPath, 'utf8'))
    const meta = raw._meta ?? {}
    const msgs = raw.messages ?? {}
    const code = meta.code || file.replace(/\.json$/, '')

    if (!meta.code || !meta.name || !meta.nativeName) {
      console.error(`[FAIL] locales/${file}: missing required _meta fields (code, name, nativeName)`)
      hasErrors = true
    }
    if (meta.dir && meta.dir !== 'ltr' && meta.dir !== 'rtl') {
      console.error(`[FAIL] locales/${file}: _meta.dir must be "ltr" or "rtl"`)
      hasErrors = true
    }
    const regEntry = registryMap.get(code)
    if (!regEntry) {
      console.error(`[FAIL] locales/${file}: locale "${code}" is missing from locales/registry.json`)
      hasErrors = true
    }

    const isBundled = Boolean(regEntry?.bundled)
    const missing = []
    const extra = []
    const placeholderMismatch = []

    for (const key of enKeys) {
      if (typeof msgs[key] !== 'string' || msgs[key].trim() === '') {
        missing.push(key)
      } else {
        const expectedVars = extractSingleBraces(enMessages[key])
        const actualVars = extractSingleBraces(msgs[key])
        if (expectedVars.join(',') !== actualVars.join(',')) {
          placeholderMismatch.push(
            `${key}: expected {${expectedVars.join(', ')}} got {${actualVars.join(', ')}}`
          )
        }
      }
    }

    for (const key of Object.keys(msgs)) {
      if (!(key in enMessages)) extra.push(key)
    }

    const translatedKeys = enKeys.length - missing.length
    const coveragePct = Math.round((translatedKeys / enKeys.length) * 100)
    summaryRows.push({
      code,
      name: meta.nativeName ?? code,
      pct: coveragePct,
      translatedKeys,
      missing: missing.length,
      bundled: isBundled
    })

    if (regEntry && updateRegistry) {
      regEntry.name = meta.name ?? regEntry.name
      regEntry.nativeName = meta.nativeName ?? regEntry.nativeName
      regEntry.dir = meta.dir === 'rtl' ? 'rtl' : 'ltr'
      regEntry.file = `locales/${file}`
      regEntry.coveragePct = coveragePct
      regEntry.translatedKeys = translatedKeys
      regEntry.version = meta.version ?? enData._meta?.version ?? '0.43.2'
      if (meta.author) regEntry.author = meta.author
    }

    if (extra.length > 0) {
      console.error(
        `[FAIL] locales/${file}: ${extra.length} unknown keys not in en.json: ${extra.slice(0, 8).join(', ')}`
      )
      hasErrors = true
    }
    if (placeholderMismatch.length > 0) {
      console.error(
        `[FAIL] locales/${file}: placeholder mismatch:\n  - ${placeholderMismatch.slice(0, 10).join('\n  - ')}`
      )
      hasErrors = true
    }
    if (isBundled && missing.length > 0) {
      console.error(
        `[FAIL] locales/${file} (bundled): ${missing.length} missing keys: ${missing.slice(0, 10).join(', ')}`
      )
      hasErrors = true
    }
  }

  if (updateRegistry && !hasErrors) {
    registry.canonicalKeys = enKeys.length
    registry.updatedAt = new Date().toISOString().slice(0, 10)
    writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
  }

  console.log('\nSleepBanana Extension i18n Validation (locales/):')
  for (const row of summaryRows) {
    const tag = row.bundled ? 'bundled  ' : 'community'
    console.log(
      `  ${row.code.padEnd(6)} ${row.name.padEnd(18)} [${tag}]  ${String(row.pct).padStart(3)}% (${row.translatedKeys}/${enKeys.length} keys)`
    )
  }
  return { hasErrors, count: summaryRows.length, canonical: enKeys.length }
}

function validateDesktopPacks() {
  const desktopDir = resolve(repoRoot, 'desktop')
  const enPath = resolve(desktopDir, 'en.json')
  const registryPath = resolve(desktopDir, 'registry.json')
  if (!existsSync(enPath) || !existsSync(registryPath)) {
    return { hasErrors: false, count: 0, canonical: 0 }
  }

  const enFlat = flattenNested(JSON.parse(readFileSync(enPath, 'utf8')))
  const enKeys = Object.keys(enFlat)
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  const registryEntries = Array.isArray(registry.locales) ? registry.locales : []
  const registryMap = new Map(registryEntries.map((l) => [l.code, l]))

  const files = readdirSync(desktopDir)
    .filter((f) => f.endsWith('.json') && f !== 'registry.json')
    .sort()

  let hasErrors = false
  const summaryRows = []

  for (const file of files) {
    const code = file.replace(/\.json$/, '')
    const flat = flattenNested(JSON.parse(readFileSync(resolve(desktopDir, file), 'utf8')))
    const regEntry = registryMap.get(code)
    if (!regEntry) {
      console.error(`[FAIL] desktop/${file}: locale "${code}" is missing from desktop/registry.json`)
      hasErrors = true
    }

    const isBundled = Boolean(regEntry?.bundled)
    let translatedKeys = 0
    const missing = []
    const placeholderMismatch = []

    for (const key of enKeys) {
      const val = flat[key]
      if (typeof val !== 'string' || val.trim() === '') {
        missing.push(key)
        continue
      }
      translatedKeys += 1
      const expectedVars = extractDoubleBraces(enFlat[key])
      const actualVars = extractDoubleBraces(val)
      if (expectedVars.join(',') !== actualVars.join(',')) {
        placeholderMismatch.push(
          `${key}: expected {{${expectedVars.join(', ')}}} got {{${actualVars.join(', ')}}}`
        )
      }
    }

    const coveragePct = Math.round((translatedKeys / enKeys.length) * 100)
    summaryRows.push({
      code,
      name: regEntry?.nativeName ?? code,
      pct: coveragePct,
      translatedKeys,
      bundled: isBundled
    })

    if (regEntry && updateRegistry) {
      regEntry.file = `desktop/${file}`
      regEntry.coveragePct = coveragePct
      regEntry.translatedKeys = translatedKeys
    }

    if (placeholderMismatch.length > 0) {
      console.error(
        `[FAIL] desktop/${file}: placeholder mismatch:\n  - ${placeholderMismatch.slice(0, 10).join('\n  - ')}`
      )
      hasErrors = true
    }
    if (isBundled && missing.length > 0) {
      console.error(
        `[FAIL] desktop/${file} (bundled): ${missing.length} missing keys: ${missing.slice(0, 10).join(', ')}`
      )
      hasErrors = true
    }
  }

  if (updateRegistry && !hasErrors) {
    registry.canonicalKeys = enKeys.length
    registry.updatedAt = new Date().toISOString().slice(0, 10)
    writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
  }

  console.log('\nSleepBanana Desktop i18n Validation (desktop/):')
  for (const row of summaryRows) {
    const tag = row.bundled ? 'bundled  ' : 'community'
    console.log(
      `  ${row.code.padEnd(6)} ${row.name.padEnd(18)} [${tag}]  ${String(row.pct).padStart(3)}% (${row.translatedKeys}/${enKeys.length} keys)`
    )
  }
  return { hasErrors, count: summaryRows.length, canonical: enKeys.length }
}

const ext = validateExtensionPacks()
const desk = validateDesktopPacks()

if (ext.hasErrors || desk.hasErrors) {
  console.error('\nValidation FAILED.')
  process.exit(1)
}
console.log(
  `\nPASS: ${ext.count} Extension pack(s) (${ext.canonical} keys) + ${desk.count} Desktop pack(s) (${desk.canonical} keys) validated.`
)
