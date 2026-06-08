import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createTopic } from '../api';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/bg.jpeg';
import styles from './NewTopicPage.module.css';

const ADMIN_CATS = ['Announcements','Guides','Mods','Events','Classes'];
const USER_CATS  = ['Questions and suggestions','Bug reports','Marketplace'];

export default function NewTopicPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [form, setForm]       = useState({
    title: '',
    category: location.state?.defaultCategory || '',
    body: '',
  });
  const [images, setImages]   = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate('/login');
  }, [user, authLoading]);

  const availableCats = user?.role === 'admin'
    ? [...ADMIN_CATS, ...USER_CATS]
    : USER_CATS;

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title',    form.title);
      fd.append('category', form.category);
      fd.append('body',     form.body);
      if (images) {
        Array.from(images).forEach(img => fd.append('images', img));
      }
      const res = await createTopic(fd);
      navigate(`/topic/${res.data.data.topic._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create topic');
    } finally { setLoading(false); }
  };

  if (authLoading) {
    return (
      <div className={styles.page} style={{ backgroundImage: `url(${bgImage})` }}>
        <div className={styles.overlay} />
        <div className={styles.centerLoad}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.page} style={{ backgroundImage: `url(${bgImage})` }}>
      <div className={styles.overlay} />
      <div className={`container ${styles.inner}`}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Create New Topic</h1>
            <Link to="/" className={styles.cancelLink}>✕ Cancel</Link>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Title</label>
              <input
                className={styles.input}
                type="text"
                name="title"
                placeholder="Enter a descriptive title..."
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <select
                className={styles.input}
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category...</option>
                {user?.role === 'admin' && (
                  <optgroup label="— Official (Admin) —">
                    {ADMIN_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                )}
                <optgroup label="— Community —">
                  {USER_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Body</label>
              <textarea
                className={styles.textarea}
                name="body"
                placeholder="Share your thoughts with the community..."
                value={form.body}
                onChange={handleChange}
                required
                rows={10}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Images (optional, up to 5)</label>
              <input
                className={styles.fileInput}
                type="file"
                accept="image/*"
                multiple
                onChange={e => setImages(e.target.files)}
              />
              <span className={styles.fileHint}>Max 5MB per image</span>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.formFooter}>
              <Link to="/" className={styles.cancelBtn}>Cancel</Link>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Posting...' : '⚔ Post Topic'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
