import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createTopic, uploadTopicImage } from '../api';
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
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    // Enforce 10 image limit
    const matches = (form.body.match(/!\[.*?\]\((.*?)\)/g) || []).length;
    if (matches >= 10) {
      setError('You can only upload up to 10 images per topic.');
      return;
    }

    setError('');
    setLoading(true);

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const placeholder = "\n[Uploading image...]\n";
    
    setForm(f => ({ ...f, body: before + placeholder + after }));

    try {
      const fd = new FormData();
      fd.append('topicImage', file);
      const res = await uploadTopicImage(fd);
      const imageUrl = res.data.data.url;
      const markdown = `\n![image](${imageUrl})\n`;
      
      setForm(f => ({ ...f, body: before + markdown + after }));
      
      setTimeout(() => {
        textarea.focus();
        const newPos = start + markdown.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image');
      setForm(f => ({ ...f, body: before + after }));
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        handleImageUpload(file);
        e.preventDefault();
        break;
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

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
      const res = await createTopic({
        title: form.title,
        category: form.category,
        body: form.body,
      });
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
              <div className={styles.textareaHeader}>
                <label className={styles.label}>Body</label>
                <button
                  type="button"
                  className={styles.insertBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  🖼️ Insert Image
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                />
              </div>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                name="body"
                placeholder="Share your thoughts with the community... (You can paste or drag & drop images directly here!)"
                value={form.body}
                onChange={handleChange}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                required
                rows={12}
              />
              <span className={styles.fileHint}>Drag & drop or paste images. Max 10 images, 5MB per image.</span>
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
