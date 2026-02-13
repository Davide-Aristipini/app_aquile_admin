import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import Shell from '../components/Shell.jsx';
import { supabase } from '../lib/supabase.js';
import { fetchStorageUsage, MAX_STORAGE_BYTES, uploadWithLimit } from '../lib/storage.js';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    ['clean'],
  ],
};

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [readMinutes, setReadMinutes] = useState(5);
  const [coverUrl, setCoverUrl] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, title, type')
        .order('title');
      const articleCategories = (categoryData || []).filter(
        (category) => category.type === 'articles'
      );
      setCategories(articleCategories);

      if (articleCategories.length && !categoryId) {
        setCategoryId(articleCategories[0].id);
      }

      if (isEditing) {
        const { data: article } = await supabase
          .from('articles')
          .select('id, title, summary, category_id, content, cover_url, video_url, tags, read_minutes')
          .eq('id', id)
          .single();
        if (article) {
          setTitle(article.title || '');
          setSummary(article.summary || '');
          setCategoryId(article.category_id || '');
          setCoverUrl(article.cover_url || '');
          setVideoUrl(article.video_url || '');
          setContent(article.content?.html || '');
          setTags((article.tags || []).join(', '));
          setReadMinutes(article.read_minutes || 5);
        }

        const { data: attachmentData } = await supabase
          .from('attachments')
          .select('id, label, file_url')
          .eq('article_id', id);
        setAttachments(attachmentData || []);
      }

      try {
        const size = await fetchStorageUsage();
        setUsage(size);
      } catch (error) {
        // ignore
      }
    };
    load();
  }, [id, isEditing, categoryId]);

  const usagePercent = useMemo(
    () => Math.min(1, usage / MAX_STORAGE_BYTES),
    [usage]
  );

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const path = `covers/${crypto.randomUUID()}-${file.name}`;
    try {
      const url = await uploadWithLimit({
        file,
        bucket: 'covers',
        path,
      });
      setCoverUrl(url);
      setUsage((prev) => prev + file.size);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAttachmentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !id) {
      alert('Salva prima l articolo.');
      return;
    }
    const label = prompt('Nome allegato');
    if (!label) return;
    const path = `attachments/${crypto.randomUUID()}-${file.name}`;
    try {
      const url = await uploadWithLimit({
        file,
        bucket: 'attachments',
        path,
      });
      const { data } = await supabase.from('attachments').insert({
        article_id: id,
        label,
        file_url: url,
      }).select('id, label, file_url').single();
      setAttachments((prev) => [...prev, data]);
      setUsage((prev) => prev + file.size);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title,
      summary,
      category_id: categoryId,
      cover_url: coverUrl,
      video_url: videoUrl || null,
      content: { html: content },
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      read_minutes: readMinutes,
    };

    if (isEditing) {
      await supabase.from('articles').update(payload).eq('id', id);
    } else {
      const { data } = await supabase
        .from('articles')
        .insert(payload)
        .select('id')
        .single();
      if (data?.id) {
        // No-op, we will navigate to dashboard after save.
      }
    }
    setSaving(false);
    navigate('/');
  };

  const handleSeedCategories = async () => {
    const defaults = [
      { title: 'Bans', slug: 'bans', type: 'articles' },
      { title: 'Idee attivita', slug: 'attivita', type: 'articles' },
      { title: 'Canti', slug: 'canti', type: 'articles' },
      { title: 'Giochi', slug: 'giochi', type: 'articles' },
    ];
    await supabase.from('categories').insert(defaults);
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id, title, type')
      .order('title');
    const articleCategories = (categoryData || []).filter(
      (category) => category.type === 'articles'
    );
    setCategories(articleCategories);
    if (articleCategories.length) {
      setCategoryId(articleCategories[0].id);
    }
  };

  const stepLabels = ['Categoria', 'Titolo e cover', 'Contenuto'];
  const canGoNext = () => {
    if (step === 0) return Boolean(categoryId);
    if (step === 1) return Boolean(title.trim() && summary.trim());
    return true;
  };

  return (
    <Shell>
      <div className="top-row">
        <div>
          <h1>{isEditing ? 'Modifica articolo' : 'Nuovo articolo'}</h1>
          <p>Costruisci contenuti ricchi con testo, immagini e allegati.</p>
        </div>
        <button className="button" type="button" onClick={handleSave}>
          {saving ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Spazio disponibile</h3>
        <div className="usage-bar" style={{ marginTop: 8 }}>
          <span style={{ width: `${usagePercent * 100}%` }} />
        </div>
        <p style={{ marginTop: 8 }}>
          {formatGb(usage)} / 1 GB
        </p>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="stepper">
          {stepLabels.map((label, index) => (
            <div
              key={label}
              className={`step ${index === step ? 'active' : ''} ${
                index < step ? 'done' : ''
              }`}
            >
              <div className="step-dot">{index + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3>1. Scegli la categoria</h3>
          {categories.length === 0 ? (
            <div style={{ marginTop: 12 }}>
              <p>
                Nessuna categoria trovata. Crea le 4 categorie base per l app.
              </p>
              <button
                type="button"
                className="button"
                onClick={handleSeedCategories}
              >
                Crea categorie
              </button>
            </div>
          ) : (
            <div className="grid two" style={{ marginTop: 12 }}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`category-tile ${
                    categoryId === category.id ? 'selected' : ''
                  }`}
                  onClick={() => setCategoryId(category.id)}
                >
                  <span>{category.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="editor-grid" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>2. Titolo e copertina</h3>
            <label>
              Titolo
              <input
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label style={{ marginTop: 12 }}>
              Descrizione breve
              <textarea
                className="input"
                rows="3"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>
            <div className="grid two" style={{ marginTop: 12 }}>
              <label>
                Minuti lettura
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={readMinutes}
                  onChange={(event) => setReadMinutes(Number(event.target.value))}
                />
              </label>
              <label>
                Tag (virgole)
                <input
                  className="input"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                />
              </label>
            </div>
            <label style={{ marginTop: 12 }}>
              Video (URL)
              <input
                className="input"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
              />
            </label>
            <div style={{ marginTop: 16 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
              />
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt="cover"
                  style={{ marginTop: 12, width: '100%', borderRadius: 12 }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="editor-grid" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>3. Contenuto stile WordPress</h3>
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={quillModules}
              theme="snow"
            />
          </div>
          <div className="card">
            <h3>Allegati</h3>
            <p>Carica PDF o documenti per i giochi.</p>
            <input type="file" onChange={handleAttachmentUpload} />
            <div className="list" style={{ marginTop: 12 }}>
              {attachments.map((attachment) => (
                <div key={attachment.id} className="list-item">
                  <span>{attachment.label}</span>
                  <a href={attachment.file_url} target="_blank" rel="noreferrer">
                    Apri
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="toolbar" style={{ marginTop: 24 }}>
        <button
          className="button secondary"
          type="button"
          onClick={() => setStep((prev) => Math.max(0, prev - 1))}
          disabled={step === 0}
        >
          Indietro
        </button>
        {step < 2 ? (
          <button
            className="button"
            type="button"
            onClick={() => setStep((prev) => Math.min(2, prev + 1))}
            disabled={!canGoNext()}
          >
            Avanti
          </button>
        ) : (
          <button className="button" type="button" onClick={handleSave}>
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        )}
      </div>
    </Shell>
  );
}

function formatGb(bytes) {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
