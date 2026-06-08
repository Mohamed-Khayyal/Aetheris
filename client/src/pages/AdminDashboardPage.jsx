import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers, deleteUser, createAdmin, getImageUrl } from '../api';
import bgImage from '../assets/bg.jpeg';
import styles from './AdminDashboardPage.module.css';

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Create admin form state
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await getUsers();
      setUsers(res.data.data.users);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, loading]);

  const handleDeleteUser = async (id, name) => {
    if (id === user.id || id === user._id) {
      alert('You cannot delete your own admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) {
      return;
    }

    try {
      await deleteUser(id);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleFormChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async e => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('password', form.password);
      if (photo) {
        fd.append('photo', photo);
      }

      await createAdmin(fd);
      setFormSuccess('Admin account created successfully!');
      setForm({ name: '', email: '', password: '' });
      setPhoto(null);
      
      // Reset file input
      const fileInput = document.getElementById('photo-input');
      if (fileInput) fileInput.value = '';

      // Refresh users list
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create admin account');
    } finally {
      setSubmitting(false);
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

  if (user?.role !== 'admin') {
    return null; // Prevents render flash before redirect
  }

  return (
    <div className={styles.page} style={{ backgroundImage: `url(${bgImage})` }}>
      <div className={styles.overlay} />
      <div className={`container ${styles.inner}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Command Center</h1>
          <p className={styles.subtitle}>Manage users and dispatch new administrators</p>
        </div>

        <div className={styles.dashboardGrid}>
          {/* Dispatch Admin Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🛡️ Dispatch New Admin</h2>
            <form onSubmit={handleFormSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className={styles.input}
                  placeholder="Enter full name..."
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  className={styles.input}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  className={styles.input}
                  placeholder="At least 6 characters..."
                  required
                  minLength={6}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Profile Picture (optional)</label>
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  onChange={e => setPhoto(e.target.files[0])}
                  className={styles.fileInput}
                />
                <span className={styles.fileHint}>Will be uploaded directly to Cloudinary</span>
              </div>

              {formError && <p className={styles.error}>{formError}</p>}
              {formSuccess && <p className={styles.success}>{formSuccess}</p>}

              <button type="submit" disabled={submitting} className={styles.submitBtn}>
                {submitting ? 'Creating Admin...' : '⚔ Create Admin'}
              </button>
            </form>
          </div>

          {/* Manage Users Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>👥 Realm Inhabitants ({users.length})</h2>
            
            {loadingUsers ? (
              <div className={styles.centerLoad}>
                <div className={styles.spinner} />
              </div>
            ) : users.length === 0 ? (
              <p className={styles.emptyText}>No users found in the database.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Avatar</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const isSelf = u._id === user.id || u._id === user._id;
                      return (
                        <tr key={u._id} className={isSelf ? styles.selfRow : ''}>
                          <td>
                            <div className={styles.avatar}>
                              {u.photo ? (
                                <img src={getImageUrl(u.photo)} alt={u.name} />
                              ) : (
                                u.name[0].toUpperCase()
                              )}
                            </div>
                          </td>
                          <td>
                            <div className={styles.nameCol}>
                              <span className={styles.userName}>{u.name}</span>
                              <span className={styles.userEmail}>{u.email}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.roleBadge} ${styles[u.role]}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            {isSelf ? (
                              <span className={styles.currentAdminText}>Active Admin</span>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(u._id, u.name)}
                                className={styles.deleteBtn}
                                title="Delete user permanently"
                              >
                                🗑 Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
