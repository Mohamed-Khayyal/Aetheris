import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getTopicById, createComment, updateComment,
  deleteComment, deleteTopic, likeTopic, getImageUrl,
  updateTopic, uploadTopicImage,
} from '../api';
import { useAuth } from '../context/AuthContext';
import styles from './TopicPage.module.css';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TopicPage() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [topic,        setTopic]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [commentText,  setCommentText]  = useState('');
  const [posting,      setPosting]      = useState(false);
  const [postError,    setPostError]    = useState('');

  // Edit comment state
  const [editId,       setEditId]       = useState(null);
  const [editText,     setEditText]     = useState('');
  const [editLoading,  setEditLoading]  = useState(false);

  // Like state
  const [liked,        setLiked]        = useState(false);
  const [likesCount,   setLikesCount]   = useState(0);
  const [liking,       setLiking]       = useState(false);

  // Edit topic state
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicCategory, setEditTopicCategory] = useState('');
  const [editTopicBody, setEditTopicBody] = useState('');
  const [topicEditLoading, setTopicEditLoading] = useState(false);
  const [topicEditError, setTopicEditError] = useState('');

  const editTopicTextareaRef = useRef(null);
  const editTopicFileInputRef = useRef(null);

  const ADMIN_CATS = ['Announcements', 'Guides', 'Mods', 'Events', 'Classes'];
  const USER_CATS  = ['Questions and suggestions', 'Bug reports', 'Marketplace'];
  const availableCats = user?.role === 'admin'
    ? [...ADMIN_CATS, ...USER_CATS]
    : USER_CATS;

  const startEditTopic = () => {
    if (!topic) return;
    setEditTopicTitle(topic.title);
    setEditTopicCategory(topic.category);
    setEditTopicBody(topic.body);
    setTopicEditError('');
    setIsEditingTopic(true);
  };

  const handleTopicImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setTopicEditError('Only image files are allowed');
      return;
    }

    const matches = (editTopicBody.match(/!\[.*?\]\((.*?)\)/g) || []).length;
    if (matches >= 10) {
      setTopicEditError('You can only upload up to 10 images per topic.');
      return;
    }

    setTopicEditError('');
    setTopicEditLoading(true);

    const textarea = editTopicTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const placeholder = "\n[Uploading image...]\n";
    
    setEditTopicBody(before + placeholder + after);

    try {
      const fd = new FormData();
      fd.append('topicImage', file);
      const res = await uploadTopicImage(fd);
      const imageUrl = res.data.data.url;
      const markdown = `\n![image](${imageUrl})\n`;
      
      setEditTopicBody(before + markdown + after);
      
      setTimeout(() => {
        textarea.focus();
        const newPos = start + markdown.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 100);
    } catch (err) {
      setTopicEditError(err.response?.data?.message || 'Failed to upload image');
      setEditTopicBody(before + after);
    } finally {
      setTopicEditLoading(false);
    }
  };

  const handleTopicPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        handleTopicImageUpload(file);
        e.preventDefault();
        break;
      }
    }
  };

  const handleTopicDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleTopicImageUpload(files[0]);
    }
  };

  const handleTopicDragOver = (e) => {
    e.preventDefault();
  };

  const handleTopicEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTopicTitle.trim() || !editTopicBody.trim() || !editTopicCategory.trim()) return;
    setTopicEditLoading(true);
    setTopicEditError('');

    try {
      await updateTopic(id, {
        title: editTopicTitle,
        category: editTopicCategory,
        body: editTopicBody,
      });
      setIsEditingTopic(false);
      await fetchTopic();
    } catch (err) {
      setTopicEditError(err.response?.data?.message || 'Failed to update topic');
    } finally {
      setTopicEditLoading(false);
    }
  };

  const renderBody = (text) => {
    if (!text) return null;
    const regex = /!\[.*?\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const textPart = text.substring(lastIndex, match.index);
      if (textPart) {
        parts.push(<span key={`txt-${lastIndex}`} style={{ whiteSpace: 'pre-wrap' }}>{textPart}</span>);
      }
      const imageUrl = match[1];
      parts.push(
        <div key={`img-${match.index}`} className={styles.embeddedImageWrap}>
          <a href={getImageUrl(imageUrl)} target="_blank" rel="noreferrer" aria-label="View full size image">
            <img src={getImageUrl(imageUrl)} alt="Embedded content" className={styles.embeddedImg} loading="lazy" />
          </a>
        </div>
      );
      lastIndex = regex.lastIndex;
    }
    
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(<span key={`txt-${lastIndex}`} style={{ whiteSpace: 'pre-wrap' }}>{remainingText}</span>);
    }
    
    return <div className={styles.bodyContent}>{parts}</div>;
  };

  const bottomRef = useRef(null);

  const fetchTopic = async () => {
    setLoading(true);
    try {
      const res = await getTopicById(id);
      const t   = res.data.data.topic;
      setTopic(t);
      setLikesCount(t.likesCount || 0);
      // Check if current user liked this topic
      if (user && t.likes) {
        setLiked(t.likes.some(uid => uid === user.id || uid === user._id));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTopic(); }, [id]);

  /* ── Like ── */
  const handleLike = async () => {
    if (!user) return navigate('/login');
    if (liking) return;
    setLiking(true);
    try {
      const res    = await likeTopic(id);
      setLiked(res.data.data.liked);
      setLikesCount(res.data.data.likesCount);
    } catch { /* ignore */ }
    finally { setLiking(false); }
  };

  /* ── Post comment ── */

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPosting(true); setPostError('');
    try {
      await createComment(id, { body: commentText });
      setCommentText('');
      await fetchTopic();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to post comment');
    } finally { setPosting(false); }
  };

  /* ── Edit comment ── */
  const startEdit = (comment) => {
    setEditId(comment._id);
    setEditText(comment.body);
  };
  const cancelEdit = () => { setEditId(null); setEditText(''); };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    setEditLoading(true);
    try {
      await updateComment(editId, { body: editText });
      setEditId(null); setEditText('');
      await fetchTopic();
    } catch { /* ignore */ }
    finally { setEditLoading(false); }
  };

  /* ── Delete comment ── */
  const handleDeleteComment = async (cid) => {
    if (!window.confirm('Delete this comment?')) return;
    await deleteComment(cid);
    await fetchTopic();
  };

  /* ── Delete topic ── */
  const handleDeleteTopic = async () => {
    if (!window.confirm('Delete this topic permanently?')) return;
    await deleteTopic(id);
    navigate(-1);
  };

  /* ─────────────────── RENDER ─────────────────── */
  if (loading) return (
    <div className={styles.centerLoad}><div className={styles.spinner} /></div>
  );

  if (!topic) return (
    <div className={styles.centerLoad}>
      <p>Topic not found.</p>
      <Link to="/" className={styles.backLink}>← Back to Forum</Link>
    </div>
  );

  const isOwner   = user && (user.id === topic.author?._id || user._id === topic.author?._id);
  const isAdmin   = user?.role === 'admin';
  const comments  = topic.comments || [];

  const isAdminCategory = ADMIN_CATS.includes(topic.category);
  const isAdminAuthor = topic.author?.role === 'admin';
  const isLockedTopic = isAdminCategory || isAdminAuthor;

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/" className={styles.bLink}>Forum</Link>
          <span className={styles.bSep}>/</span>
          <Link to={`/category/${encodeURIComponent(topic.category)}`} className={styles.bLink}>
            {topic.category}
          </Link>
          <span className={styles.bSep}>/</span>
          <span className={styles.bCur}>{topic.title}</span>
        </div>

        {/* Topic header */}
        <div className={styles.topicHeader}>
          {topic.isPinned && <span className={styles.pinLabel}>📌 Pinned</span>}
          <div className={styles.headerRow}>
            <h1 className={styles.topicTitle}>{topic.title}</h1>
            <div className={styles.headerActions}>
              {/* Like button */}
              <button
                className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
                onClick={handleLike}
                disabled={liking}
                title={liked ? 'Unlike' : 'Like'}
              >
                {liked ? '❤️' : '🤍'} <span>{likesCount}</span>
              </button>
              {/* Edit/Delete topic (owner can edit, owner/admin can delete) */}
              {!isEditingTopic && (
                <>
                  {isOwner && (
                    <button className={styles.editBtn} onClick={startEditTopic} title="Edit topic">
                      ✏️ Edit
                    </button>
                  )}
                  {(isOwner || isAdmin) && (
                    <button className={styles.deleteBtn} onClick={handleDeleteTopic} title="Delete topic">
                      🗑 Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div className={styles.topicMeta}>
            <span className={styles.catPill}>{topic.category}</span>
            <span>by <strong>{topic.author?.name}</strong></span>
            <span>{timeAgo(topic.createdAt)}</span>
            <span>💬 {comments.length} replies</span>
            <span>❤️ {likesCount} likes</span>
          </div>
        </div>

        {/* Original Post */}
        <div className={styles.postCard}>
          <div className={styles.postAuthorCol}>
            <div className={styles.bigAvatar}>
              {topic.author?.photo
                ? <img src={getImageUrl(topic.author.photo)} alt={topic.author.name} />
                : topic.author?.name?.[0]?.toUpperCase()}
            </div>
            <span className={styles.postAuthorName}>{topic.author?.name}</span>
            <span className={`${styles.roleTag} ${styles[topic.author?.role]}`}>
              {topic.author?.role}
            </span>
          </div>
          <div className={styles.postBody}>
            {isEditingTopic ? (
              <form onSubmit={handleTopicEditSubmit} className={styles.editTopicForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="editTopicTitle" className={styles.label}>Title</label>
                  <input
                    id="editTopicTitle"
                    type="text"
                    className={styles.editTopicInput}
                    value={editTopicTitle}
                    onChange={e => setEditTopicTitle(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="editTopicCategory" className={styles.label}>Category</label>
                  <select
                    id="editTopicCategory"
                    className={styles.editTopicSelect}
                    value={editTopicCategory}
                    onChange={e => setEditTopicCategory(e.target.value)}
                    required
                  >
                    {availableCats.map(catName => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <div className={styles.textareaHeader}>
                    <label htmlFor="editTopicBody" className={styles.label}>Body</label>
                    <button
                      type="button"
                      className={styles.insertBtn}
                      onClick={() => editTopicFileInputRef.current?.click()}
                      disabled={topicEditLoading}
                    >
                      🖼️ Insert Image
                    </button>
                    <input
                      type="file"
                      ref={editTopicFileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleTopicImageUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                  <textarea
                    id="editTopicBody"
                    ref={editTopicTextareaRef}
                    className={styles.editTopicTextarea}
                    value={editTopicBody}
                    onChange={e => setEditTopicBody(e.target.value)}
                    onPaste={handleTopicPaste}
                    onDrop={handleTopicDrop}
                    onDragOver={handleTopicDragOver}
                    rows={12}
                    required
                  />
                  <span className={styles.fileHint}>Drag & drop or paste images. Max 10 images, 5MB per image.</span>
                </div>
                {topicEditError && <p className={styles.errorText}>{topicEditError}</p>}
                <div className={styles.editTopicActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setIsEditingTopic(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={topicEditLoading}>
                    {topicEditLoading ? 'Saving...' : '✓ Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className={styles.postDate}>{timeAgo(topic.createdAt)}</div>
                <div className={styles.postText}>{renderBody(topic.body)}</div>
                {topic.images?.length > 0 && (
                  <div className={styles.imageGrid}>
                    {topic.images.map((url, i) => (
                      <a key={i} href={getImageUrl(url)} target="_blank" rel="noreferrer" aria-label={`View full size image ${i + 1}`}>
                        <img src={getImageUrl(url)} alt={`img-${i}`} className={styles.postImg} loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Replies Label */}
        {comments.length > 0 && (
          <div className={styles.repliesLabel}>
            💬 {comments.length} {comments.length === 1 ? 'Reply' : 'Replies'}
          </div>
        )}

        {/* Comments */}
        <div className={styles.commentsList}>
          {comments.map((c, idx) => {
            const isCOwner = user && (user.id === c.author?._id || user._id === c.author?._id);
            const isEditing = editId === c._id;

            return (
              <div key={c._id} className={styles.commentCard}>
                <div className={styles.commentAuthorCol}>
                  <div className={styles.smallAvatar}>
                    {c.author?.photo
                      ? <img src={getImageUrl(c.author.photo)} alt={c.author.name} />
                      : c.author?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className={styles.commentAuthorName}>{c.author?.name}</span>
                  <span className={`${styles.roleTag} ${styles.small} ${styles[c.author?.role]}`}>
                    {c.author?.role}
                  </span>
                </div>

                <div className={styles.commentBody}>
                  <div className={styles.commentMeta}>
                    <span className={styles.commentNum}>#{idx + 1}</span>
                    <span className={styles.commentDate}>{timeAgo(c.createdAt)}</span>
                    {(isCOwner || isAdmin) && !isEditing && (
                      <div className={styles.commentActions}>
                        {isCOwner && (
                          <button
                            className={styles.editCommentBtn}
                            onClick={() => startEdit(c)}
                            title="Edit comment"
                          >✏️ Edit</button>
                        )}
                        <button
                          className={styles.deleteCommentBtn}
                          onClick={() => handleDeleteComment(c._id)}
                          title="Delete comment"
                        >🗑 Delete</button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleEditSubmit} className={styles.editForm}>
                      <textarea
                        className={styles.editInput}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={4}
                        required
                        autoFocus
                      />
                      <div className={styles.editActions}>
                        <button type="button" className={styles.cancelEditBtn} onClick={cancelEdit}>
                          Cancel
                        </button>
                        <button type="submit" className={styles.saveEditBtn} disabled={editLoading}>
                          {editLoading ? 'Saving...' : '✓ Save'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className={styles.commentText}>{c.body}</p>
                      {c.image && (
                        <a href={getImageUrl(c.image)} target="_blank" rel="noreferrer" aria-label="View full size comment attachment">
                          <img src={getImageUrl(c.image)} alt="attachment" className={styles.commentImg} loading="lazy" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div ref={bottomRef} />

        {/* Reply Box */}
        {isLockedTopic && !isAdmin ? (
          user ? (
            <div >
            </div>
          ) : (
            <div className={styles.loginPrompt}>
              🛡️ Comments are disabled for official administrator topics. <Link to="/login" className={styles.loginPromptLink}>Login</Link> to like this topic.
            </div>
          )
        ) : user ? (
          <div className={styles.replyBox}>
            <h2 className={styles.replyTitle}>Post a Reply</h2>
            <form onSubmit={handleComment}>
              <textarea
                className={styles.replyInput}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                rows={5}
                required
              />
              {postError && <p className={styles.replyError}>{postError}</p>}
              <div className={styles.replyFooter}>
                <button type="submit" className={styles.replyBtn} disabled={posting}>
                  {posting ? 'Posting...' : '⚔ Post Reply'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className={styles.loginPrompt}>
            <Link to="/login" className={styles.loginPromptLink}>Login</Link> to like and reply.
          </div>
        )}
      </div>
    </div>
  );
}
