import { useSearchParams } from 'react-router-dom'
import { THREAT_MODEL_DATA } from '../utils/placeholderData'

const VERDENT_URL = import.meta.env.VITE_VERDENT_THREAT_MODEL_URL ?? ''

const RISK_CLASS: Record<string, string> = {
  High: 'tag-high',
  Medium: 'tag-medium',
  Low: 'tag-low',
}

export function DemoThreatModel() {
  const [params] = useSearchParams()
  const project = params.get('project') ?? import.meta.env.VITE_PROJECT_NAME ?? 'jjk-gesture-skill-router'
  const repo    = params.get('repo')    ?? import.meta.env.VITE_REPO_NAME    ?? 'jjk-gesture'

  const d = THREAT_MODEL_DATA
  const ghBase = `https://github.com/vladasanadev/${repo}`

  return (
    <div className="demo-page">
      <div className="demo-header">
        <div className="demo-meta">
          <span className="demo-label">{d.label}</span>
          <span className="chip chip-red">{d.gestureChip}</span>
        </div>
        <h2>
          <a href={ghBase} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            vladasanadev / {repo}
          </a>
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
          Project: <strong style={{ color: 'var(--text)' }}>{project}</strong>
          &nbsp;·&nbsp;
          <a href={`${ghBase}/security`} target="_blank" rel="noreferrer" style={{ color: 'var(--red)' }}>
            Security tab ↗
          </a>
          &nbsp;·&nbsp;
          <a href={`${ghBase}/network/dependencies`} target="_blank" rel="noreferrer" style={{ color: 'var(--red)' }}>
            Dependencies ↗
          </a>
        </p>
      </div>

      <section className="demo-section">
        <h3>System Summary</h3>
        <p className="summary-text">{d.summary}</p>
      </section>

      <div className="demo-grid">
        <section className="demo-section">
          <h3>Assets</h3>
          <ul className="simple-list">
            {d.assets.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </section>
        <section className="demo-section">
          <h3>Trust Boundaries</h3>
          <ul className="simple-list">
            {d.trustBoundaries.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </section>
        <section className="demo-section">
          <h3>Entry Points</h3>
          <ul className="simple-list">
            {d.entryPoints.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </section>
        <section className="demo-section">
          <h3>Attacker Goals</h3>
          <ul className="simple-list">
            {d.attackerGoals.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </section>
      </div>

      <section className="demo-section">
        <h3>Vulnerabilities — {d.vulnerabilities.length} findings</h3>
        <table className="risk-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Risk</th><th>Detail</th></tr>
          </thead>
          <tbody>
            {d.vulnerabilities.map(v => (
              <tr key={v.id}>
                <td><code>{v.id}</code></td>
                <td>{v.name}</td>
                <td><span className={`severity-tag ${RISK_CLASS[v.risk]}`}>{v.risk}</span></td>
                <td>{v.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="demo-section">
        <h3>Mitigations</h3>
        <ol className="mitigations-list">
          {d.mitigations.map((m, i) => <li key={i}>{m}</li>)}
        </ol>
      </section>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <a className="btn-verdent btn-red" href={VERDENT_URL} target="_blank" rel="noreferrer">
          Open GitHub Security ↗
        </a>
        <a className="btn-verdent btn-red" href={ghBase} target="_blank" rel="noreferrer">
          View Repository ↗
        </a>
      </div>
    </div>
  )
}
