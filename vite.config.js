import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ── PROOF — the margins carry real revision history ──
// At build time we ask git how many times each section of the magazine was
// re-set and how many lines were struck. The numbers land in the margins as
// proofreader's marks (see Proof.jsx). Pulled from `git log`, so — like the
// Tear — they cannot be faked without faking the history itself.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const day = (iso) => (iso ? `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(8, 10)}` : null)

function churn(git, files) {
  const paths = files.map((f) => `"${f}"`).join(' ')
  let add = 0
  let del = 0
  for (const line of git(`log --numstat --format= -- ${paths}`).split('\n')) {
    const [a, d] = line.split('\t')
    if (/^\d+$/.test(a)) {
      add += Number(a)
      del += Number(d)
    }
  }
  const revs = git(`log --oneline -- ${paths}`).split('\n').filter(Boolean).length
  const last = day(git(`log -1 --format=%as -- ${paths}`))
  return { revs, add, del, last }
}

function proofData() {
  try {
    const git = (args) => execSync(`git ${args}`, { encoding: 'utf8' }).trim()
    const sections = {
      record: ['src/components/Record.jsx', 'src/components/Record.css'],
      shipped: ['src/components/Projects.jsx', 'src/components/Projects.css'],
      stack: ['src/components/Stack.jsx', 'src/components/Stack.css'],
    }
    const out = { sections: {}, total: null }
    for (const [key, files] of Object.entries(sections)) out.sections[key] = churn(git, files)

    let add = 0
    let del = 0
    for (const line of git('log --numstat --format=').split('\n')) {
      const [a, d] = line.split('\t')
      if (/^\d+$/.test(a)) {
        add += Number(a)
        del += Number(d)
      }
    }
    const printings = Number(git('rev-list --count HEAD'))
    const first = day(git('log --reverse --format=%as').split('\n')[0])
    out.total = { printings, add, del, first }
    return out
  } catch {
    return { sections: {}, total: null } // no git (CI tarball etc.) — marks stay off the page
  }
}

const proofmarks = () => ({
  name: 'proofmarks',
  resolveId(id) {
    if (id === 'virtual:proof') return '\0virtual:proof'
  },
  load(id) {
    if (id === '\0virtual:proof') return `export default ${JSON.stringify(proofData())}`
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), proofmarks()],
})
