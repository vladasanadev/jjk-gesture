import { useSearchParams } from 'react-router-dom'
import { PR_REVIEW_DATA } from '../utils/placeholderData'

const VERDENT_URL = import.meta.env.VITE_VERDENT_PR_REVIEW_URL ?? ''

const SEVERITY_CLASS: Record<string, string> = {
  high: 'tag-high',
  medium: 'tag-medium',
  low: 'tag-low',
}

export function DemoPrReview() {
  const [params] = useSearchParams()
  const project = params.get('project') ?? import.meta.env.VITE_PROJECT_NAME ?? 'jjk-gesture-skill-router'
  const repo    = params.get('repo')    ?? import.meta.env.VITE_REPO_NAME    ?? 'jjk-gesture'

  const d = PR_REVIEW_DATA
  const ghBase = `https://github.com/vladasanadev/${repo}`

  return (
    <div className="demo-page">
      <div className="demo-header">
        <div className="demo-meta">
          <span className="demo-label">{d.label}</span>
          <span className="chip chip-purple">{d.gestureChip}</span>
        </div>
        <h2>
          <a href={ghBase} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            vladasanadev / {repo}
          </a>
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
          Project: <strong style={{ color: 'var(--text)' }}>{project}</strong>
          &nbsp;·&nbsp;
          <a href={`${ghBase}/commits/main`} target="_blank" rel="noreferrer" style={{ color: 'var(--purple)' }}>
            View commits ↗
          </a>
          &nbsp;·&nbsp;
          <a href={`${ghBase}/pulls`} target="_blank" rel="noreferrer" style={{ color: 'var(--purple)' }}>
            Pull requests ↗
          </a>
        </p>
      </div>

      <section className="demo-section">
        <h3>Code Diff</h3>
        <pre className="code-diff">{d.diff}</pre>
      </section>

      <section className="demo-section">
        <h3>Review Findings — {d.findings.length} issues</h3>
        <div className="findings-list">
          {d.findings.map((f, i) => (
            <div key={i} className="finding-card">
              <div className="finding-top">
                <span className={`severity-tag ${SEVERITY_CLASS[f.severity]}`}>{f.severity}</span>
                <span className="finding-location">
                  <a
                    href={`${ghBase}/blob/main/${f.file}#L${f.line}`}
                    target="_blank" rel="noreferrer"
                    style={{ color: 'var(--text-dim)', textDecoration: 'none' }}
                  >
                    {f.file}:{f.line} ↗
                  </a>
                </span>
              </div>
              <p className="finding-message">{f.message}</p>
              <p className="finding-suggestion">💡 {f.suggestion}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="demo-section">
        <h3>Suggested PR Comments</h3>
        <ul className="pr-comments">
          {d.comments.map((c, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: c }} />
          ))}
        </ul>
      </section>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <a className="btn-verdent" href={VERDENT_URL} target="_blank" rel="noreferrer">
          Open GitHub PRs ↗
        </a>
        <a className="btn-verdent" href={ghBase} target="_blank" rel="noreferrer">
          View Repository ↗
        </a>
      </div>
    </div>
  )
}
