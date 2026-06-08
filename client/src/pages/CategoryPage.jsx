import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getTopics, getImageUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import styles from './CategoryPage.module.css';

const CAT_META = {
  'Announcements':             { icon: '📢', color: 'gold' },
  'Guides':                    { icon: '📖', color: 'gold' },
  'Mods':                      { icon: '🔧', color: 'gold' },
  'Events':                    { icon: '🎉', color: 'gold' },
  'Classes':                   { icon: '🎓', color: 'gold' },
  'Questions and suggestions': { icon: '❓', color: 'red' },
  'Bug reports':               { icon: '🐛', color: 'red' },
  'Marketplace':               { icon: '🛒', color: 'red' },
};

export default function CategoryPage() {
  const { category } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const decodedCat = decodeURIComponent(category);

  const [topics, setTopics] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const meta = CAT_META[decodedCat] || { icon: '💬', color: 'red' };

  useEffect(() => {
    setLoading(true);
    getTopics({ category: decodedCat, page, limit: 20 })
      .then(res => {
        setTopics(res.data.data.topics);
        setPagination(res.data.data.pagination);
      })
      .finally(() => setLoading(false));
  }, [decodedCat, page]);

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/" className={styles.breadLink}>Forum</Link>
          <span className={styles.breadSep}>/</span>
          <span className={styles.breadCurrent}>{decodedCat}</span>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={`${styles.headerIcon} ${styles[meta.color]}`}>{meta.icon}</span>
            <h1 className={styles.title}>{decodedCat}</h1>
          </div>
          {user && (
            <Link
              to="/new-topic"
              state={{ defaultCategory: decodedCat }}
              className={styles.newBtn}
            >
              + New Topic
            </Link>
          )}
        </div>

        {/* Topics Table Header */}
        <div className={styles.tableHead}>
          <span>Topic</span>
          <span>Author</span>
          <span>Replies</span>
          <span>Last Post</span>
        </div>

        {/* Topics */}
        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : topics.length === 0 ? (
          <div className={styles.empty}>
            <span>🌑</span>
            <p>No topics in this section yet.</p>
            {user && <Link to="/new-topic" className={styles.emptyLink}>Be the first to post →</Link>}
          </div>
        ) : (
          <div className={styles.topicList}>
            {topics.map(topic => (
              <div
                key={topic._id}
                className={`${styles.topicRow} ${topic.isPinned ? styles.pinned : ''}`}
                onClick={() => navigate(`/topic/${topic._id}`)}
              >
                <div className={styles.topicMain}>
                  {topic.isPinned && <span className={styles.pinBadge}>📌 Pinned</span>}
                  <h3 className={styles.topicTitle}>{topic.title}</h3>
                  <p className={styles.topicSnippet}>
                    {topic.body?.slice(0, 100)}{topic.body?.length > 100 ? '...' : ''}
                  </p>
                </div>
                <div className={styles.topicAuthor}>
                  <div className={styles.authorAvatar}>
                    {topic.author?.photo
                      ? <img src={getImageUrl(topic.author.photo)} alt={topic.author.name} />
                      : topic.author?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className={styles.authorName}>{topic.author?.name}</span>
                </div>
                <div className={styles.topicReplies}>
                  <span className={styles.replyNum}>{topic.commentsCount}</span>
                  <span className={styles.replyLbl}>replies</span>
                </div>
                <div className={styles.topicDate}>
                  {new Date(topic.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className={styles.pagination}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`${styles.pageBtn} ${p === page ? styles.active : ''}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
