import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="empty-page">
      <h2>404 — Page not found</h2>
      <p>The page you requested does not exist.</p>
      <Link to="/" className="btn btn-success">
        Return to Dashboard
      </Link>
    </section>
  )
}
