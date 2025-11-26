import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [serverUrl, setServerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Parse URL to extract editor ID and server UUID
      const url = new URL(serverUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      
      if (pathParts.length >= 2) {
        const editorId = pathParts[0];
        const serverUuid = pathParts[1];
        router.push(`/${editorId}/${serverUuid}`);
      } else {
        setError('Invalid URL format. Please use the URL from /superior web connect');
      }
    } catch (err) {
      setError('Invalid URL. Please enter a valid editor URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Superior Web Editor</title>
        <meta name="description" content="Superior Minecraft Plugin Web Editor" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>🚀 Superior Web Editor</h1>
          <p style={styles.subtitle}>Manage your Minecraft server with ease</p>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Connect to Your Server</h2>
            <p style={styles.cardText}>
              Run <code style={styles.code}>/superior web connect</code> in-game to get your editor URL
            </p>

            <form onSubmit={handleConnect} style={styles.form}>
              <input
                type="text"
                placeholder="Paste your editor URL here..."
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                style={styles.input}
                required
              />
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            </form>

            {error && <p style={styles.error}>{error}</p>}
          </div>

          <div style={styles.features}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>👑</div>
              <h3>Rank Editor</h3>
              <p>Create and manage ranks visually</p>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>🏷️</div>
              <h3>Tag Designer</h3>
              <p>Design custom player tags</p>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>⚡</div>
              <h3>Real-time Sync</h3>
              <p>Changes apply instantly</p>
            </div>
          </div>

          <footer style={styles.footer}>
            <p>Made with ❤️ by Pulsewave-Dev</p>
          </footer>
        </div>
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  content: {
    maxWidth: '800px',
    width: '100%',
    textAlign: 'center',
  },
  title: {
    fontSize: '3em',
    color: 'white',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: '1.2em',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: '40px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    padding: '40px',
    marginBottom: '40px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
  },
  cardTitle: {
    color: 'white',
    fontSize: '1.8em',
    marginBottom: '10px',
  },
  cardText: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: '30px',
  },
  code: {
    background: 'rgba(0,0,0,0.3)',
    padding: '5px 10px',
    borderRadius: '5px',
    fontFamily: 'monospace',
    color: '#a8e6cf',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '15px',
    borderRadius: '10px',
    border: '2px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '1em',
    outline: 'none',
  },
  button: {
    padding: '15px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontSize: '1.1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  error: {
    color: '#ff6b6b',
    marginTop: '15px',
    background: 'rgba(255,107,107,0.2)',
    padding: '10px',
    borderRadius: '5px',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  feature: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '10px',
    padding: '30px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    color: 'white',
  },
  featureIcon: {
    fontSize: '3em',
    marginBottom: '15px',
  },
  footer: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: '40px',
  },
};
