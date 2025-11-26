import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

interface Rank {
  id: string;
  name: string;
  prefix: string;
  suffix: string;
  color: string;
  weight: number;
  default: boolean;
  permissions: string[];
}

export default function EditorPage() {
  const router = useRouter();
  const { editorId, serverUuid } = router.query;
  
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('ranks');
  const [editingRank, setEditingRank] = useState<Rank | null>(null);

  useEffect(() => {
    if (editorId && serverUuid) {
      loadData();
    }
  }, [editorId, serverUuid]);

  const loadData = async () => {
    try {
      setLoading(true);
      // In production, this would connect to your MC server's web API
      // For now, we'll use demo data
      setRanks([
        { id: 'owner', name: 'Owner', prefix: '&c[OWNER] ', suffix: '', color: '&c', weight: 1000, default: false, permissions: ['*'] },
        { id: 'admin', name: 'Admin', prefix: '&4[ADMIN] ', suffix: '', color: '&4', weight: 900, default: false, permissions: [] },
        { id: 'member', name: 'Member', prefix: '&7', suffix: '', color: '&7', weight: 0, default: true, permissions: [] },
      ]);
      setServerInfo({ online: 5, maxPlayers: 100 });
      setLoading(false);
    } catch (err) {
      setError('Failed to connect to server');
      setLoading(false);
    }
  };

  const createRank = () => {
    const newRank: Rank = {
      id: 'new_rank',
      name: 'New Rank',
      prefix: '&a[NEW] ',
      suffix: '',
      color: '&a',
      weight: 100,
      default: false,
      permissions: [],
    };
    setEditingRank(newRank);
  };

  const saveRank = async () => {
    if (!editingRank) return;

    try {
      const existingIndex = ranks.findIndex(r => r.id === editingRank.id);
      const action = existingIndex >= 0 ? 'update' : 'create';
      
      // Update local state
      if (existingIndex >= 0) {
        const newRanks = [...ranks];
        newRanks[existingIndex] = editingRank;
        setRanks(newRanks);
      } else {
        setRanks([...ranks, editingRank]);
      }
      
      // Send to MongoDB
      await fetch(`/api/editor/${editorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankChanges: [{
            action,
            rankId: editingRank.id,
            displayName: editingRank.name,
            prefix: editingRank.prefix,
            suffix: editingRank.suffix,
            color: editingRank.color,
            weight: editingRank.weight,
            isDefault: editingRank.default,
            permissions: editingRank.permissions
          }]
        })
      });
      
      setEditingRank(null);
    } catch (err) {
      alert('Failed to save rank');
    }
  };

  const deleteRank = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rank?')) return;
    
    try {
      setRanks(ranks.filter(r => r.id !== id));
      
      // Send delete to MongoDB
      await fetch(`/api/editor/${editorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankChanges: [{
            action: 'delete',
            rankId: id
          }]
        })
      });
    } catch (err) {
      alert('Failed to delete rank');
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <h1>🔄 Connecting to server...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <h1>❌ {error}</h1>
        <button onClick={() => router.push('/')} style={styles.button}>Go Back</button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Superior Editor - {serverUuid}</title>
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>🚀 Superior Editor</h1>
          <div style={styles.serverInfo}>
            <span>Server: {serverUuid}</span>
            <span>Online: {serverInfo?.online || 0}</span>
          </div>
        </header>

        <nav style={styles.nav}>
          <button 
            style={{...styles.navButton, ...(activeTab === 'ranks' ? styles.navButtonActive : {})}}
            onClick={() => setActiveTab('ranks')}
          >
            👑 Ranks
          </button>
          <button 
            style={{...styles.navButton, ...(activeTab === 'tags' ? styles.navButtonActive : {})}}
            onClick={() => setActiveTab('tags')}
          >
            🏷️ Tags
          </button>
        </nav>

        <main style={styles.main}>
          {activeTab === 'ranks' && (
            <div>
              <div style={styles.toolbar}>
                <h2 style={styles.sectionTitle}>Rank Manager</h2>
                <button onClick={createRank} style={styles.createButton}>+ Create Rank</button>
              </div>

              <div style={styles.grid}>
                {ranks.map(rank => (
                  <div key={rank.id} style={styles.card}>
                    <h3 style={styles.rankName}>{rank.name}</h3>
                    <div style={styles.rankPreview}>
                      <span style={{ color: rank.color.replace('&', '#') }}>
                        {rank.prefix}{rank.name}{rank.suffix}
                      </span>
                    </div>
                    <p style={styles.rankInfo}>Weight: {rank.weight}</p>
                    <p style={styles.rankInfo}>Permissions: {rank.permissions.length}</p>
                    <div style={styles.cardActions}>
                      <button onClick={() => setEditingRank(rank)} style={styles.editButton}>Edit</button>
                      <button onClick={() => deleteRank(rank.id)} style={styles.deleteButton}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div>
              <h2 style={styles.sectionTitle}>Tag Manager</h2>
              <p style={styles.comingSoon}>Coming soon! Tag editor will be available in the next update.</p>
            </div>
          )}
        </main>

        {editingRank && (
          <div style={styles.modal} onClick={() => setEditingRank(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Edit Rank</h2>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>ID</label>
                <input 
                  type="text" 
                  value={editingRank.id}
                  onChange={(e) => setEditingRank({...editingRank, id: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Name</label>
                <input 
                  type="text" 
                  value={editingRank.name}
                  onChange={(e) => setEditingRank({...editingRank, name: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Prefix</label>
                <input 
                  type="text" 
                  value={editingRank.prefix}
                  onChange={(e) => setEditingRank({...editingRank, prefix: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Weight</label>
                <input 
                  type="number" 
                  value={editingRank.weight}
                  onChange={(e) => setEditingRank({...editingRank, weight: parseInt(e.target.value)})}
                  style={styles.input}
                />
              </div>

              <div style={styles.preview}>
                <p>Preview:</p>
                <span style={{ color: '#fff', fontSize: '1.2em' }}>
                  {editingRank.prefix}{editingRank.name}{editingRank.suffix}
                </span>
              </div>

              <div style={styles.modalActions}>
                <button onClick={saveRank} style={styles.saveButton}>Save</button>
                <button onClick={() => setEditingRank(null)} style={styles.cancelButton}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  header: {
    padding: '20px',
    background: 'rgba(0,0,0,0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  headerTitle: {
    margin: 0,
    fontSize: '2em',
  },
  serverInfo: {
    display: 'flex',
    gap: '20px',
    fontSize: '0.9em',
    opacity: 0.9,
  },
  nav: {
    padding: '20px',
    display: 'flex',
    gap: '10px',
  },
  navButton: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: '2px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'all 0.3s',
  },
  navButtonActive: {
    background: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  main: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.8em',
  },
  createButton: {
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(46, 213, 115, 0.8)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    padding: '20px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
  },
  rankName: {
    margin: '0 0 10px 0',
    fontSize: '1.5em',
  },
  rankPreview: {
    padding: '10px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '5px',
    marginBottom: '10px',
    fontFamily: 'monospace',
  },
  rankInfo: {
    margin: '5px 0',
    opacity: 0.8,
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
  },
  editButton: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(52, 152, 219, 0.8)',
    color: 'white',
    cursor: 'pointer',
  },
  deleteButton: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(231, 76, 60, 0.8)',
    color: 'white',
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalContent: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '15px',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: {
    marginTop: 0,
    fontSize: '1.8em',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '1em',
  },
  preview: {
    padding: '15px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
  },
  saveButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(46, 213, 115, 0.8)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1em',
  },
  loading: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  error: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  button: {
    padding: '15px 30px',
    borderRadius: '10px',
    border: 'none',
    background: 'white',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    marginTop: '20px',
  },
  comingSoon: {
    fontSize: '1.2em',
    textAlign: 'center',
    padding: '60px 20px',
    opacity: 0.7,
  },
};

