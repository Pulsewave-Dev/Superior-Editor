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

interface Tag {
  id: string;
  displayName: string;
  prefix: string;
  suffix: string;
  priority: number;
}

export default function EditorPage() {
  const router = useRouter();
  const { editorId, serverUuid, api } = router.query;
  
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSync, setLastSync] = useState<number>(0);
  const [activeTab, setActiveTab] = useState('ranks');
  const [editingRank, setEditingRank] = useState<Rank | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    if (api && typeof api === 'string') {
      setApiUrl(api);
    }
  }, [api]);

  useEffect(() => {
    if (editorId && serverUuid && apiUrl) {
      loadData();
      const interval = setInterval(loadData, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [editorId, serverUuid, apiUrl]);

  const loadData = async () => {
    if (!apiUrl) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/editor/${editorId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect to server');
      }
      
      const data = await response.json();
      setRanks(data.ranks || []);
      setTags(data.tags || []);
      setLastSync(data.lastUpdated || Date.now());
      setLoading(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
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
      setSaving(true);
      const existingIndex = ranks.findIndex(r => r.id === editingRank.id);
      const action = existingIndex >= 0 ? 'update' : 'create';
      
      // Update local state immediately for responsive UI
      if (existingIndex >= 0) {
        const newRanks = [...ranks];
        newRanks[existingIndex] = editingRank;
        setRanks(newRanks);
      } else {
        setRanks([...ranks, editingRank]);
      }
      
      // Send changes to API
      const response = await fetch(`${apiUrl}/api/editor/${editorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankChanges: [{
            action,
            rankId: editingRank.id,
            name: editingRank.name,
            prefix: editingRank.prefix,
            suffix: editingRank.suffix,
            color: editingRank.color,
            weight: editingRank.weight,
            default: editingRank.default,
            permissions: editingRank.permissions
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save changes');
      }
      
      setEditingRank(null);
      setSaving(false);
      
      // Show success animation
      showSuccessToast('Rank saved successfully!');
    } catch (err: any) {
      alert('Failed to save rank: ' + err.message);
      setSaving(false);
    }
  };

  const deleteRank = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rank?')) return;
    
    try {
      setSaving(true);
      setRanks(ranks.filter(r => r.id !== id));
      
      // Send delete to API
      await fetch(`${apiUrl}/api/editor/${editorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankChanges: [{
            action: 'delete',
            rankId: id
          }]
        })
      });
      
      setSaving(false);
      showSuccessToast('Rank deleted successfully!');
    } catch (err) {
      alert('Failed to delete rank');
      setSaving(false);
    }
  };

  const createTag = () => {
    const newTag: Tag = {
      id: 'new_tag',
      displayName: 'New Tag',
      prefix: '&a[NEW] ',
      suffix: '',
      priority: 100,
    };
    setEditingTag(newTag);
  };

  const saveTag = async () => {
    if (!editingTag) return;

    try {
      setSaving(true);
      const existingIndex = tags.findIndex(t => t.id === editingTag.id);
      const action = existingIndex >= 0 ? 'update' : 'create';
      
      if (existingIndex >= 0) {
        const newTags = [...tags];
        newTags[existingIndex] = editingTag;
        setTags(newTags);
      } else {
        setTags([...tags, editingTag]);
      }
      
      await fetch(`${apiUrl}/api/editor/${editorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagChanges: [{
            action,
            tagId: editingTag.id,
            displayName: editingTag.displayName,
            prefix: editingTag.prefix,
            suffix: editingTag.suffix,
            priority: editingTag.priority
          }]
        })
      });
      
      setEditingTag(null);
      setSaving(false);
      showSuccessToast('Tag saved successfully!');
    } catch (err: any) {
      alert('Failed to save tag: ' + err.message);
      setSaving(false);
    }
  };

  const deleteTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    
    try {
      setSaving(true);
      setTags(tags.filter(t => t.id !== id));
      
      await fetch(`${apiUrl}/api/editor/${editorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagChanges: [{
            action: 'delete',
            tagId: id
          }]
        })
      });
      
      setSaving(false);
      showSuccessToast('Tag deleted successfully!');
    } catch (err) {
      alert('Failed to delete tag');
      setSaving(false);
    }
  };

  const showSuccessToast = (message: string) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(46, 213, 115, 0.9);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: bold;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  const filteredRanks = ranks.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTags = tags.filter(t => 
    t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!apiUrl) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingSpinner}></div>
        <h1 style={{marginTop: '20px'}}>Initializing Editor...</h1>
        <p style={{opacity: 0.7}}>Connecting to Minecraft server...</p>
      </div>
    );
  }

  if (loading && ranks.length === 0) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingSpinner}></div>
        <h1 style={{marginTop: '20px', animation: 'pulse 1.5s infinite'}}>🔄 Connecting to server...</h1>
        <p style={{opacity: 0.7}}>Loading Superior Editor...</p>
      </div>
    );
  }

  if (error && ranks.length === 0) {
    return (
      <div style={styles.error}>
        <div style={{fontSize: '4em', marginBottom: '20px'}}>❌</div>
        <h1>{error}</h1>
        <p style={{opacity: 0.7, marginTop: '10px'}}>Please check your connection and try again</p>
        <button onClick={() => loadData()} style={styles.retryButton}>🔄 Retry</button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Superior Editor - {serverUuid}</title>
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
          @keyframes fadeInUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes modalSlide {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          * { box-sizing: border-box; }
        `}</style>
      </Head>

      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.headerTitle}>✨ Superior Editor</h1>
            <div style={styles.badge}>
              <span style={{fontSize: '10px', opacity: 0.8}}>⚡ LIVE</span>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.serverInfo}>
              <span style={styles.infoLabel}>Session</span>
              <span style={styles.infoValue}>{editorId?.toString().substring(0, 8)}</span>
            </div>
            <div style={styles.syncIndicator}>
              <div style={saving ? styles.syncSpinner : {}}></div>
              <span style={{fontSize: '12px', marginLeft: '8px'}}>
                {saving ? 'Saving...' : 'Synced'}
              </span>
            </div>
            <button onClick={downloadChanges} style={styles.downloadButton}>
              💾 Download Changes
            </button>
          </div>
        </header>

        <nav style={styles.nav}>
          <div style={styles.navTabs}>
            <button 
              style={{...styles.navButton, ...(activeTab === 'ranks' ? styles.navButtonActive : {})}}
              onClick={() => { setActiveTab('ranks'); setSearchQuery(''); }}
            >
              <span style={{fontSize: '20px'}}>👑</span>
              <span>Ranks</span>
              <span style={styles.navBadge}>{ranks.length}</span>
            </button>
            <button 
              style={{...styles.navButton, ...(activeTab === 'tags' ? styles.navButtonActive : {})}}
              onClick={() => { setActiveTab('tags'); setSearchQuery(''); }}
            >
              <span style={{fontSize: '20px'}}>🏷️</span>
              <span>Tags</span>
              <span style={styles.navBadge}>{tags.length}</span>
            </button>
          </div>
          <input
            type="text"
            placeholder={`🔍 Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </nav>

        <main style={styles.main}>
          {activeTab === 'ranks' && (
            <div style={{animation: 'fadeInUp 0.5s ease-out'}}>
              <div style={styles.toolbar}>
                <div>
                  <h2 style={styles.sectionTitle}>Rank Management</h2>
                  <p style={styles.subtitle}>
                    {filteredRanks.length} rank{filteredRanks.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <button onClick={createRank} style={styles.createButton}>
                  <span style={{fontSize: '18px'}}>+</span> Create Rank
                </button>
              </div>

              <div style={styles.grid}>
                {filteredRanks.map((rank, index) => (
                  <div 
                    key={rank.id} 
                    style={{
                      ...styles.card,
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`
                    }}
                  >
                    <div style={styles.cardHeader}>
                      <h3 style={styles.rankName}>{rank.name}</h3>
                      {rank.default && <span style={styles.defaultBadge}>DEFAULT</span>}
                    </div>
                    <div style={styles.rankPreview}>
                      <code style={{color: '#fff', fontFamily: 'monospace'}}>
                        {rank.prefix}{rank.name}{rank.suffix}
                      </code>
                    </div>
                    <div style={styles.rankDetails}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>⚡ Weight</span>
                        <span style={styles.detailValue}>{rank.weight}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>🔑 Permissions</span>
                        <span style={styles.detailValue}>{rank.permissions?.length || 0}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>🎨 Color</span>
                        <span style={styles.detailValue}>{rank.color}</span>
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <button onClick={() => setEditingRank(rank)} style={styles.editButton}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => deleteRank(rank.id)} style={styles.deleteButton}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div style={{animation: 'fadeInUp 0.5s ease-out'}}>
              <div style={styles.toolbar}>
                <div>
                  <h2 style={styles.sectionTitle}>Tag Management</h2>
                  <p style={styles.subtitle}>
                    {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <button onClick={createTag} style={styles.createButton}>
                  <span style={{fontSize: '18px'}}>+</span> Create Tag
                </button>
              </div>

              <div style={styles.grid}>
                {filteredTags.map((tag, index) => (
                  <div 
                    key={tag.id} 
                    style={{
                      ...styles.card,
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`
                    }}
                  >
                    <div style={styles.cardHeader}>
                      <h3 style={styles.rankName}>{tag.displayName}</h3>
                    </div>
                    <div style={styles.rankPreview}>
                      <code style={{color: '#fff', fontFamily: 'monospace'}}>
                        {tag.prefix}{tag.displayName}{tag.suffix}
                      </code>
                    </div>
                    <div style={styles.rankDetails}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>🎯 Priority</span>
                        <span style={styles.detailValue}>{tag.priority}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>🆔 ID</span>
                        <span style={styles.detailValue}>{tag.id}</span>
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <button onClick={() => setEditingTag(tag)} style={styles.editButton}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => deleteTag(tag.id)} style={styles.deleteButton}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {editingRank && (
          <div style={styles.modal} onClick={() => setEditingRank(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  {ranks.find((r: Rank) => r.id === editingRank.id) ? '✏️ Edit Rank' : '➕ Create Rank'}
                </h2>
                <button onClick={() => setEditingRank(null)} style={styles.closeButton}>✕</button>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>🆔 Rank ID</label>
                <input 
                  type="text" 
                  value={editingRank.id}
                  onChange={(e) => setEditingRank({...editingRank, id: e.target.value})}
                  style={styles.input}
                  placeholder="admin"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📝 Display Name</label>
                <input 
                  type="text" 
                  value={editingRank.name}
                  onChange={(e) => setEditingRank({...editingRank, name: e.target.value})}
                  style={styles.input}
                  placeholder="Admin"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>🎨 Color Code</label>
                  <input 
                    type="text" 
                    value={editingRank.color}
                    onChange={(e) => setEditingRank({...editingRank, color: e.target.value})}
                    style={styles.input}
                    placeholder="&c"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>⚡ Weight</label>
                  <input 
                    type="number" 
                    value={editingRank.weight}
                    onChange={(e) => setEditingRank({...editingRank, weight: parseInt(e.target.value) || 0})}
                    style={styles.input}
                    placeholder="100"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📌 Prefix</label>
                <input 
                  type="text" 
                  value={editingRank.prefix}
                  onChange={(e) => setEditingRank({...editingRank, prefix: e.target.value})}
                  style={styles.input}
                  placeholder="&c[ADMIN] "
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📍 Suffix</label>
                <input 
                  type="text" 
                  value={editingRank.suffix}
                  onChange={(e) => setEditingRank({...editingRank, suffix: e.target.value})}
                  style={styles.input}
                  placeholder=""
                />
              </div>

              <div style={styles.preview}>
                <p style={{margin: '0 0 10px 0', fontWeight: 'bold'}}>✨ Preview:</p>
                <div style={styles.previewBox}>
                  <code style={{ color: '#fff', fontSize: '1.2em', fontFamily: 'monospace' }}>
                    {editingRank.prefix}{editingRank.name}{editingRank.suffix}
                  </code>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button onClick={saveRank} style={styles.saveButton} disabled={saving}>
                  {saving ? '💾 Saving...' : '💾 Save Changes'}
                </button>
                <button onClick={() => setEditingRank(null)} style={styles.cancelButton}>
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {editingTag && (
          <div style={styles.modal} onClick={() => setEditingTag(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  {tags.find((t: Tag) => t.id === editingTag.id) ? '✏️ Edit Tag' : '➕ Create Tag'}
                </h2>
                <button onClick={() => setEditingTag(null)} style={styles.closeButton}>✕</button>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>🆔 Tag ID</label>
                <input 
                  type="text" 
                  value={editingTag.id}
                  onChange={(e) => setEditingTag({...editingTag, id: e.target.value})}
                  style={styles.input}
                  placeholder="vip"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📝 Display Name</label>
                <input 
                  type="text" 
                  value={editingTag.displayName}
                  onChange={(e) => setEditingTag({...editingTag, displayName: e.target.value})}
                  style={styles.input}
                  placeholder="VIP"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>🎯 Priority</label>
                <input 
                  type="number" 
                  value={editingTag.priority}
                  onChange={(e) => setEditingTag({...editingTag, priority: parseInt(e.target.value) || 0})}
                  style={styles.input}
                  placeholder="100"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📌 Prefix</label>
                <input 
                  type="text" 
                  value={editingTag.prefix}
                  onChange={(e) => setEditingTag({...editingTag, prefix: e.target.value})}
                  style={styles.input}
                  placeholder="&a[VIP] "
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📍 Suffix</label>
                <input 
                  type="text" 
                  value={editingTag.suffix}
                  onChange={(e) => setEditingTag({...editingTag, suffix: e.target.value})}
                  style={styles.input}
                  placeholder=""
                />
              </div>

              <div style={styles.preview}>
                <p style={{margin: '0 0 10px 0', fontWeight: 'bold'}}>✨ Preview:</p>
                <div style={styles.previewBox}>
                  <code style={{ color: '#fff', fontSize: '1.2em', fontFamily: 'monospace' }}>
                    {editingTag.prefix}{editingTag.displayName}{editingTag.suffix}
                  </code>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button onClick={saveTag} style={styles.saveButton} disabled={saving}>
                  {saving ? '💾 Saving...' : '💾 Save Changes'}
                </button>
                <button onClick={() => setEditingTag(null)} style={styles.cancelButton}>
                  ❌ Cancel
                </button>
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    padding: '24px 32px',
    background: 'rgba(0,0,0,0.25)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerTitle: {
    margin: 0,
    fontSize: '2.2em',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  badge: {
    padding: '6px 12px',
    background: 'rgba(46, 213, 115, 0.2)',
    border: '1px solid rgba(46, 213, 115, 0.4)',
    borderRadius: '20px',
    animation: 'pulse 2s infinite',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  serverInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    textAlign: 'right',
  },
  infoLabel: {
    fontSize: '11px',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  syncIndicator: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '20px',
    fontSize: '14px',
  },
  syncSpinner: {
    width: '12px',
    height: '12px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  nav: {
    padding: '20px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  navTabs: {
    display: 'flex',
    gap: '12px',
  },
  navButton: {
    padding: '14px 24px',
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.05)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backdropFilter: 'blur(10px)',
  },
  navButtonActive: {
    background: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.4)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
  },
  navBadge: {
    background: 'rgba(255,255,255,0.2)',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 700,
  },
  searchInput: {
    padding: '12px 20px',
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s',
    minWidth: '280px',
    backdropFilter: 'blur(10px)',
  },
  main: {
    padding: '32px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  sectionTitle: {
    margin: '0 0 6px 0',
    fontSize: '2.4em',
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    opacity: 0.7,
    fontSize: '15px',
  },
  createButton: {
    padding: '14px 28px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #2ed573 0%, #26de81 100%)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 700,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(46, 213, 115, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '24px',
    border: '2px solid rgba(255, 255, 255, 0.18)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  rankName: {
    margin: 0,
    fontSize: '1.8em',
    fontWeight: 700,
  },
  defaultBadge: {
    padding: '4px 10px',
    background: 'rgba(255, 193, 7, 0.2)',
    border: '1px solid rgba(255, 193, 7, 0.4)',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1px',
  },
  rankPreview: {
    padding: '16px',
    background: 'rgba(0,0,0,0.4)',
    borderRadius: '10px',
    marginBottom: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  rankDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
  },
  detailLabel: {
    fontSize: '14px',
    opacity: 0.9,
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: 'monospace',
  },
  cardActions: {
    display: 'flex',
    gap: '12px',
  },
  editButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
  },
  deleteButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  modalContent: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '24px',
    padding: '32px',
    maxWidth: '560px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
    animation: 'modalSlide 0.3s ease-out',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '2em',
    fontWeight: 700,
  },
  closeButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 700,
    transition: 'all 0.3s',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    fontSize: '15px',
  },
  input: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '2px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  preview: {
    padding: '20px',
    background: 'rgba(0,0,0,0.35)',
    borderRadius: '12px',
    marginBottom: '24px',
    border: '2px solid rgba(255,255,255,0.1)',
  },
  previewBox: {
    padding: '16px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    textAlign: 'center',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
  },
  saveButton: {
    flex: 1,
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #2ed573 0%, #26de81 100%)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 700,
    transition: 'all 0.3s',
    boxShadow: '0 4px 16px rgba(46, 213, 115, 0.4)',
  },
  cancelButton: {
    flex: 1,
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'all 0.3s',
  },
  loading: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  loadingSpinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(255,255,255,0.2)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    textAlign: 'center',
    padding: '20px',
  },
  retryButton: {
    padding: '16px 32px',
    borderRadius: '12px',
    border: 'none',
    background: 'white',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 700,
    marginTop: '20px',
    boxShadow: '0 4px 16px rgba(255,255,255,0.2)',
    transition: 'all 0.3s',
  },
  uploadLabel: {
    cursor: 'pointer',
  },
  uploadButton: {
    padding: '18px 36px',
    borderRadius: '16px',
    border: 'none',
    background: 'linear-gradient(135deg, #2ed573 0%, #26de81 100%)',
    color: 'white',
    fontSize: '18px',
    fontWeight: 700,
    boxShadow: '0 8px 24px rgba(46, 213, 115, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
  },
  downloadButton: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
  },
};
