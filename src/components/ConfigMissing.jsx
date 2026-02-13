export default function ConfigMissing() {
  return (
    <div className="login">
      <div className="login-card">
        <h2>Configurazione mancante</h2>
        <p>Le variabili Supabase non sono state trovate.</p>
        <div style={{ marginTop: 12 }}>
          <code>VITE_SUPABASE_URL</code>
          <br />
          <code>VITE_SUPABASE_ANON_KEY</code>
        </div>
        <p style={{ marginTop: 12 }}>
          Se fai deploy manuale, ricostruisci il progetto dopo aver creato il
          file <code>.env</code> e ricarica la cartella <code>dist</code>.
        </p>
      </div>
    </div>
  );
}
