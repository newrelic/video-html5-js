/*
 * Detects drift between what was released and what S3 is currently serving.
 * Uses only public endpoints and node built-ins — no credentials needed.
 *
 * Usage: node cdn-integrity-monitor.mjs [--repo owner/name] [--releases 5]
 */
import { createHash } from 'node:crypto'
import { readFile, appendFile } from 'node:fs/promises'

const MANIFEST_ASSET = 'integrity-manifest.json'
const S3_BASE = 'https://download.newrelic.com/media-agents/browser/html5'

// Generous grace period: the release is public as soon as it is published, but the
// manifest is only attached and S3 files only land after the s3-upload job completes.
// Used as a fallback when the upload run cannot be looked up via the API.
const RELEASE_GRACE_MS = 2 * 60 * 60 * 1000 // 2 hours

function isWithinGrace (publishedAt, now = Date.now()) {
  if (!publishedAt) return false
  const published = new Date(publishedAt).getTime()
  return Number.isFinite(published) && now - published < RELEASE_GRACE_MS
}

function isPipelineActive (run) {
  return Boolean(run) && run.status !== 'completed'
}

function parseArgs (argv) {
  const options = { repo: process.env.GITHUB_REPOSITORY || 'newrelic/video-html5-js', releases: 5, manifests: [] }
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split('=')
    const value = () => inline ?? argv[++i]
    if (flag === '--repo') options.repo = value()
    else if (flag === '--releases') options.releases = Number(value())
    else if (flag === '--manifest') options.manifests.push(value())
  }
  return options
}

async function fetchWithRetry (url, init = {}) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(30000) })
      if (response.status < 500) return response
      lastError = new Error(`HTTP ${response.status}`)
    } catch (err) {
      lastError = err
    }
    await new Promise(r => setTimeout(r, attempt * 1000))
  }
  throw lastError
}

function sha384 (buffer) {
  return `sha384-${createHash('sha384').update(Buffer.from(buffer)).digest('base64')}`
}

// Lists recent s3-upload.yml runs so we can tell whether the upload for the newest
// release is still in progress. Returns null when the API is unreachable (callers
// fall back to isWithinGrace). Requires actions: read permission on the job.
async function listUploadRuns (repo, headers) {
  try {
    const response = await fetchWithRetry(
      `https://api.github.com/repos/${repo}/actions/workflows/s3-upload.yml/runs?per_page=20`,
      { headers }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const { workflow_runs: runs = [] } = await response.json()
    return runs
  } catch (error) {
    console.log(`::warning::Could not list S3 upload runs (${error.message}); using a time window to identify new releases.`)
    return null
  }
}

async function discoverManifests (options) {
  const headers = { Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const response = await fetchWithRetry(`https://api.github.com/repos/${options.repo}/releases?per_page=30`, { headers })
  if (!response.ok) throw new Error(`Could not list releases: HTTP ${response.status}`)

  const uploadRuns = await listUploadRuns(options.repo, headers)

  // A release is pending if its S3 upload run is still active.
  // Fallback: if no matching run is found, treat the release as pending within the grace window.
  const isPending = (release) => {
    if (uploadRuns === null) return isWithinGrace(release.published_at)
    const matchingRun = uploadRuns.find(r => new Date(r.created_at) >= new Date(release.published_at))
    return matchingRun ? isPipelineActive(matchingRun) : isWithinGrace(release.published_at)
  }

  const found = []
  let skipped = 0
  for (const release of await response.json()) {
    if (release.draft || release.prerelease) continue
    if (isPending(release)) {
      console.log(`Skipping ${release.tag_name} — S3 upload may still be in progress.`)
      skipped++
      continue
    }
    const asset = release.assets?.find(a => a.name === MANIFEST_ASSET)
    if (!asset) { skipped++; continue }
    const download = await fetchWithRetry(asset.browser_download_url)
    if (!download.ok) throw new Error(`Could not download manifest for ${release.tag_name}: HTTP ${download.status}`)
    found.push({ version: release.tag_name.replace(/^v/, ''), manifest: await download.json() })
    if (found.length >= options.releases) break
  }
  console.log(`Found ${found.length} release manifest(s); ${skipped} release(s) without one were skipped.`)
  return found
}

async function checkVersionedFiles (release, baseUrl) {
  const findings = []
  let checked = 0
  for (const [key, { sha384: expected }] of Object.entries(release.manifest.files || {})) {
    if (key.includes('.latest.')) continue
    const target = `${baseUrl}/${key}`
    checked++
    try {
      const response = await fetchWithRetry(target)
      if (!response.ok) {
        findings.push({ kind: 'unavailable', target, detail: `HTTP ${response.status}` })
        continue
      }
      const actual = sha384(await response.arrayBuffer())
      if (actual !== expected) {
        findings.push({ kind: 'mismatch', target, detail: `content does not match the ${release.version} manifest` })
      }
    } catch (err) {
      findings.push({ kind: 'unavailable', target, detail: String(err.message ?? err) })
    }
  }
  return { checked, findings }
}

async function checkLatestFile (releases, baseUrl) {
  const findings = []
  const latestKey = Object.keys(releases[0]?.manifest.files || {}).find(k => k.includes('.latest.'))
  if (!latestKey) return { checked: 0, findings }

  const target = `${baseUrl}/${latestKey}`
  try {
    const response = await fetchWithRetry(target)
    if (!response.ok) {
      findings.push({ kind: 'unavailable', target, detail: `HTTP ${response.status}` })
      return { checked: 1, findings }
    }
    const digest = sha384(await response.arrayBuffer())
    const match = releases.find(r => Object.values(r.manifest.files || {}).some(f => f.sha384 === digest))
    if (!match) {
      findings.push({ kind: 'mismatch', target, detail: 'content matches none of the checked releases' })
    } else {
      console.log(`  ${target} -> ${match.version}`)
    }
  } catch (err) {
    findings.push({ kind: 'unavailable', target, detail: String(err.message ?? err) })
  }
  return { checked: 1, findings }
}

const options = parseArgs(process.argv.slice(2))
const releases = options.manifests.length
  ? await Promise.all(options.manifests.map(async path => {
    const manifest = JSON.parse(await readFile(path, 'utf-8'))
    return { version: String(manifest.version).replace(/^v/, ''), manifest }
  }))
  : await discoverManifests(options)

if (!releases.length) {
  console.log('::warning::No release with an integrity manifest was found.')
  process.exit(0)
}

const summary = []
const findings = []

for (const [index, release] of releases.entries()) {
  console.log(`\nChecking ${release.version}${index === 0 ? ' (newest)' : ''}`)
  const result = await checkVersionedFiles(release, S3_BASE)
  summary.push(`| ${release.version} | versioned files | ${result.checked} | ${result.findings.length} |`)
  findings.push(...result.findings)
}

console.log('\nChecking latest file')
const latestResult = await checkLatestFile(releases, S3_BASE)
summary.push(`| all | latest file | ${latestResult.checked} | ${latestResult.findings.length} |`)
findings.push(...latestResult.findings)

const mismatches = findings.filter(f => f.kind === 'mismatch')
const unavailable = findings.filter(f => f.kind === 'unavailable')

const report = [
  `## CDN integrity monitor: ${findings.length ? 'FAILED' : 'passed'}`,
  '',
  '| Release | Check | Files checked | Problems |',
  '| --- | --- | --- | --- |',
  ...summary,
  ...(findings.length
    ? ['', `**${mismatches.length} mismatch(es), ${unavailable.length} unavailable.**`, '', ...findings.slice(0, 50).map(f => `- **${f.kind}** \`${f.target}\`: ${f.detail}`)]
    : [])
].join('\n')

console.log(`\n${report}`)
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report + '\n')
for (const f of mismatches.slice(0, 20)) console.log(`::error title=Integrity mismatch::${f.target} ${f.detail}`)
for (const f of unavailable.slice(0, 20)) console.log(`::warning title=Integrity check incomplete::${f.target} ${f.detail}`)
process.exit(findings.length ? 1 : 0)
