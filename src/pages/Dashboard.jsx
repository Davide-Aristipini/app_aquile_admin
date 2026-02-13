import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Shell from '../components/Shell.jsx';
import { supabase } from '../lib/supabase.js';
import { fetchStorageUsage, MAX_STORAGE_BYTES } from '../lib/storage.js';

export default function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [usage, setUsage] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, title')
        .order('title');
      setCategories(categoryData || []);

      const { data: articleData } = await supabase
        .from('articles')
        .select('id, title, summary, category_id, published_at')
        .order('created_at', { ascending: false });
      setArticles(articleData || []);

      try {
        const size = await fetchStorageUsage();
        setUsage(size);
      } catch (error) {
        // ignore for now
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return articles;
    return articles.filter((article) =>
      [article.title, article.summary].join(' ').toLowerCase().includes(q)
    );
  }, [articles, query]);

  const usagePercent = Math.min(1, usage / MAX_STORAGE_BYTES);

  return (
    <Shell>
      <div className="top-row">
        <div>
          <h1>Articoli</h1>
          <p>Gestisci gli articoli per Bans, Canti, Giochi e Attivita.</p>
        </div>
        <Link className="button" to="/articles/new">
          Nuovo articolo
        </Link>
      </div>

      <div className="grid two" style={{ marginTop: 20 }}>
        <div className="card">
          <h3>Spazio usato</h3>
          <div className="usage-bar" style={{ marginTop: 8 }}>
            <span style={{ width: `${usagePercent * 100}%` }} />
          </div>
          <p style={{ marginTop: 8 }}>
            {formatGb(usage)} / 1 GB
          </p>
        </div>
        <div className="card">
          <h3>Ricerca veloce</h3>
          <input
            className="input"
            placeholder="Cerca titolo o descrizione breve..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Ultimi articoli</h3>
        <div className="list" style={{ marginTop: 12 }}>
          {filtered.map((article) => (
            <div key={article.id} className="list-item">
              <div>
                <strong>{article.title}</strong>
                <div style={{ marginTop: 6, color: '#4b4b4f' }}>
                  {article.summary}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <span className="tag">
                    {categories.find((c) => c.id === article.category_id)
                      ?.title || 'Categoria'}
                  </span>
                  {article.published_at ? (
                    <span className="tag">Pubblicato</span>
                  ) : (
                    <span className="tag">Bozza</span>
                  )}
                </div>
              </div>
              <Link className="button secondary" to={`/articles/${article.id}`}>
                Modifica
              </Link>
            </div>
          ))}
          {filtered.length === 0 && (
            <p>Nessun articolo trovato. Crea il primo!</p>
          )}
        </div>
      </div>
    </Shell>
  );
}

function formatGb(bytes) {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
