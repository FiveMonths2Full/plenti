export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', color: '#1a1a1a', lineHeight: 1.6 }}>
      <a href="/" style={{ color: '#27500A', fontSize: 14, textDecoration: 'none' }}>← Back to Plenti</a>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 32 }}>Last updated: April 2026</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>What we collect</h2>
        <p>When you create an account, we collect your name and email address. When you record a donation, we store the items and quantities you pledged. We do not collect payment information.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>How we use it</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>To send you a confirmation email when your donation is received by the food bank</li>
          <li>To show you your donation history in your account</li>
          <li>To help food banks track what has been received</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Anonymous donations</h2>
        <p>You can donate without creating an account. Anonymous donations are stored with a claim code only — no personal information is attached.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Data sharing</h2>
        <p>We do not sell or share your personal information with third parties. Your name and email are visible only to the food bank associated with your donation and to us.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Cookies</h2>
        <p>We use a single httpOnly cookie to keep you signed in to your account. No tracking cookies or advertising cookies are used.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Error monitoring</h2>
        <p>We use Sentry to capture application errors. Error reports may include anonymized technical details (page URL, browser type, error message) but do not include your personal data.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Deleting your data</h2>
        <p>To request deletion of your account and associated donation records, email us at <a href="mailto:johnhoover42@plenti-donate.com" style={{ color: '#27500A' }}>johnhoover42@plenti-donate.com</a>.</p>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Contact</h2>
        <p>Questions? Reach us at <a href="mailto:johnhoover42@plenti-donate.com" style={{ color: '#27500A' }}>johnhoover42@plenti-donate.com</a>.</p>
      </section>
    </main>
  )
}
