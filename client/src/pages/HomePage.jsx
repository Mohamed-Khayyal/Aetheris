import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTopics } from '../api';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/bg.jpeg';
import styles from './HomePage.module.css';

const ADMIN_CATS = [
  { name: 'Announcements', icon: '📢', desc: 'Official news and announcements from the team.' },
  { name: 'Guides',        icon: '📖', desc: 'In-depth guides and tutorials for all players.' },
  { name: 'Mods',          icon: '🔧', desc: 'Mods, patches and client modifications.' },
  { name: 'Events',        icon: '🎉', desc: 'Seasonal events, contests and competitions.' },
  { name: 'Classes',       icon: '🎓', desc: 'Class guides, builds and strategies.' },
];

const USER_CATS = [
  { name: 'Questions and suggestions', icon: '❓', desc: 'Ask the community or suggest improvements.' },
  { name: 'Bug reports',               icon: '🐛', desc: 'Report bugs and technical issues here.' },
  { name: 'Marketplace',               icon: '🛒', desc: 'Trade items, services and deals.' },
];

function CategoryRow({ cat, count, lastPost, isAdmin }) {
  const navigate = useNavigate();
  return (
    <div
      className={`${styles.catRow} ${isAdmin ? styles.adminRow : styles.userRow}`}
      onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}`)}
    >
      <div className={styles.catMain}>
        <div className={`${styles.catIcon} ${isAdmin ? styles.adminIcon : styles.userIcon}`}>
          {cat.icon}
        </div>
        <div className={styles.catInfo}>
          <h2 className={styles.catName}>{cat.name}</h2>
          <p className={styles.catDesc}>{cat.desc}</p>
        </div>
      </div>
      <div className={styles.catStat}>
        <div className={styles.statNum}>{count ?? 0}</div>
        <div className={styles.statLbl}>posts</div>
      </div>
      <div className={styles.catLast}>
        {lastPost ? (
          <>
            <span className={styles.lpTitle} title={lastPost.title}>{lastPost.title}</span>
            <span className={styles.lpMeta}>by {lastPost.author?.name} · {new Date(lastPost.createdAt).toLocaleDateString()}</span>
          </>
        ) : (
          <span className={styles.noPost}>No posts yet</span>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    const allCats = [...ADMIN_CATS, ...USER_CATS];
    allCats.forEach(async cat => {
      try {
        const res = await getTopics({ category: cat.name, limit: 1 });
        const total = res.data.data.pagination.total;
        const last = res.data.data.topics[0] || null;
        setStats(prev => ({ ...prev, [cat.name]: { count: total, lastPost: last } }));
      } catch { /* ignore */ }
    });
  }, []);

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section
        className={styles.hero}
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className={styles.heroOverlay} />
        {/* <div className={`container ${styles.heroContent}`}>
  
          {!user && (
            <div className={styles.heroBtns}>
              <Link to="/register" className={styles.heroBtn}>Join Now</Link>
              <Link to="/login" className={styles.heroBtnGhost}>Login</Link>
            </div>
          )}
        </div> */}
        <div className={styles.heroGlow} />
      </section>

      {/* ── Forum Sections ── */}
      <div className={`container ${styles.forumWrap}`}>
        {/* New Topic Button */}
        <div className={styles.toolbar}>
          <h1 className={styles.sectionLabel}>Forum</h1>
          {user && (
            <Link to="/new-topic" className={styles.newBtn}>⚔ New Topic</Link>
          )}
        </div>

        {/* Admin Section */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionHeadIcon}>🛡️</span>
            <span>Official — Administrators</span>
            <div className={styles.sectionHeadLine} />
          </div>
          <div className={styles.tableHeader}>
            <span>Forum</span><span>Posts</span><span>Last Post</span>
          </div>
          {ADMIN_CATS.map(cat => (
            <CategoryRow
              key={cat.name}
              cat={cat}
              isAdmin={true}
              count={stats[cat.name]?.count}
              lastPost={stats[cat.name]?.lastPost}
            />
          ))}
        </section>

        {/* Community Section */}
        <section className={styles.section} style={{ marginTop: 32 }}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionHeadIcon}>💬</span>
            <span>Community</span>
            <div className={styles.sectionHeadLine} />
          </div>
          <div className={styles.tableHeader}>
            <span>Forum</span><span>Posts</span><span>Last Post</span>
          </div>
          {USER_CATS.map(cat => (
            <CategoryRow
              key={cat.name} 
              cat={cat}
              isAdmin={false}
              count={stats[cat.name]?.count}
              lastPost={stats[cat.name]?.lastPost}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
