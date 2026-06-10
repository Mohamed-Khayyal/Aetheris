import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTopics, updateProfile, updatePassword, getImageUrl } from '../api';
import bgImage from '../assets/bg.jpeg';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      return;
    }
    setName(user.name);

    // Fetch user's topics
    const fetchUserTopics = async () => {
      setLoadingTopics(true);
      try {
        const userId = user.id || user._id;
        const res = await getTopics({ author: userId });
        setTopics(res.data.data.topics);
      } catch (err) {
        console.error('Failed to load user topics', err);
      } finally {
        setLoadingTopics(false);
      }
    };

    fetchUserTopics();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('name', name);
      if (photo) {
        fd.append('photo', photo);
      }

      const res = await updateProfile(fd);
      setUser(res.data.data.user);
      setFormSuccess('Profile updated successfully!');
      setPhoto(null);

      // Reset file input
      const fileInput = document.getElementById('avatar-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long');
      return;
    }

    setPwdSubmitting(true);

    try {
      await updatePassword({ currentPassword, newPassword });
      setPwdSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPwdSubmitting(false);
    }
  };

  if (loading) {
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
    return null; // Redirecting...
  }

  return (
    <div className={styles.page} style={{ backgroundImage: `url(${bgImage})` }}>
      <div className={styles.overlay} />
      <div className={`container ${styles.inner}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Hero Profile</h1>
          <p className={styles.subtitle}>Customize your character and view your journey's chronicles</p>
        </div>

        <div className={styles.profileGrid}>
          <div className={styles.leftColumn}>
            {/* Profile Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>🛡️ Character Details</h2>
              
              <div className={styles.avatarSection}>
                <div className={styles.avatarLarge}>
                  {user.photo ? (
                    <img src={getImageUrl(user.photo)} alt={user.name} />
                  ) : (
                    user.name[0].toUpperCase()
                  )}
                </div>
                <div className={styles.avatarInfo}>
                  <span className={styles.roleBadge}>{user.role}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address (Read-only)</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className={styles.inputDisabled}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Character Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                    placeholder="Enter name..."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Avatar Photo</label>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files[0])}
                    className={styles.fileInput}
                  />
                  <span className={styles.fileHint}>Upload to customize your avatar</span>
                </div>

                {formError && <p className={styles.error}>{formError}</p>}
                {formSuccess && <p className={styles.success}>{formSuccess}</p>}

                <button type="submit" disabled={submitting} className={styles.submitBtn}>
                  {submitting ? 'Forging Profile...' : '⚔ Save Changes'}
                </button>
              </form>
            </div>

            {/* Change Password Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>🛡️ Change Password</h2>
              <form onSubmit={handlePasswordSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Enter current password..."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Enter new password (min. 6 chars)..."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Confirm new password..."
                    required
                  />
                </div>

                {pwdError && <p className={styles.error}>{pwdError}</p>}
                {pwdSuccess && <p className={styles.success}>{pwdSuccess}</p>}

                <button type="submit" disabled={pwdSubmitting} className={styles.submitBtn}>
                  {pwdSubmitting ? 'Forging Password...' : '⚔ Change Password'}
                </button>
              </form>
            </div>
          </div>

          {/* Chronicles/Topics Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📜 My Chronicles ({topics.length})</h2>

            {loadingTopics ? (
              <div className={styles.centerLoad}>
                <div className={styles.spinner} />
              </div>
            ) : topics.length === 0 ? (
              <div className={styles.emptyContainer}>
                <p className={styles.emptyText}>You haven't chronicled any topics yet.</p>
                <Link to="/new-topic" className={styles.createBtn}>
                  ⚔ Create Topic
                </Link>
              </div>
            ) : (
              <div className={styles.topicsList}>
                {topics.map((t) => (
                  <Link key={t._id} to={`/topic/${t._id}`} className={styles.topicCard}>
                    <div className={styles.topicHeader}>
                      <span className={styles.categoryBadge}>{t.category}</span>
                      <span className={styles.dateText}>
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className={styles.topicTitle}>{t.title}</h3>
                    <div className={styles.topicFooter}>
                      <span className={styles.metaItem}>
                        👍 {t.likesCount} {t.likesCount === 1 ? 'Like' : 'Likes'}
                      </span>
                      <span className={styles.metaItem}>
                        💬 {t.commentsCount} {t.commentsCount === 1 ? 'Comment' : 'Comments'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
