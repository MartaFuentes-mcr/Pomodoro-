import { useMemo, useState } from "react";

export default function BackgroundLibraryScreen({
  popularBackgrounds,
  animatedBackgrounds,
  animatedBackgroundId,
  setAnimatedBackgroundId,
  clearAnimatedBackground,
  allCommunityBackgrounds,
  favoriteCommunityBackgrounds,
  backgroundUrl,
  setBackgroundUrl,
  toggleCommunityFavorite,
  likeCommunityBackground,
}) {
  const [libraryTab, setLibraryTab] = useState("popular");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const set = new Set((popularBackgrounds || []).map((item) => item.category || "otros"));
    return ["all", ...Array.from(set)];
  }, [popularBackgrounds]);

  const currentItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let source = [];
    if (libraryTab === "community") source = allCommunityBackgrounds;
    else if (libraryTab === "favorites") source = favoriteCommunityBackgrounds;
    else source = popularBackgrounds;

    return source.filter((item) => {
      const by = item.by || "";
      const itemCategory = item.category || "otros";
      if (libraryTab === "popular" && category !== "all" && itemCategory !== category) return false;
      if (!q) return true;
      return `${item.name || ""} ${by} ${itemCategory}`.toLowerCase().includes(q);
    });
  }, [libraryTab, allCommunityBackgrounds, favoriteCommunityBackgrounds, popularBackgrounds, search, category]);

  return (
    <section className="library-main">
      <div className="library-head">
        <h2>Libreria de fondos</h2>
        <p>Elige un fondo predeterminado, comunidad o animado.</p>
      </div>

      <div className="library-tabs">
        <button type="button" className={libraryTab === "popular" ? "active" : ""} onClick={() => setLibraryTab("popular")}>
          predeterminados ({popularBackgrounds.length})
        </button>
        <button type="button" className={libraryTab === "community" ? "active" : ""} onClick={() => setLibraryTab("community")}>
          comunidad ({allCommunityBackgrounds.length})
        </button>
        <button type="button" className={libraryTab === "favorites" ? "active" : ""} onClick={() => setLibraryTab("favorites")}>
          favoritos ({favoriteCommunityBackgrounds.length})
        </button>
        <button type="button" className={libraryTab === "animated" ? "active" : ""} onClick={() => setLibraryTab("animated")}>
          animados/3D ({animatedBackgrounds.length})
        </button>
      </div>

      {libraryTab === "animated" && (
        <div className="library-grid">
          <article className={`library-card ${animatedBackgroundId === "" ? "selected" : ""}`}>
            <div className="library-card-body">
              <strong>Sin animado</strong>
              <button type="button" onClick={clearAnimatedBackground}>
                desactivar
              </button>
            </div>
          </article>
          {animatedBackgrounds.map((item) => (
            <article key={item.id} className={`library-card ${animatedBackgroundId === item.id ? "selected" : ""}`}>
              <video src={item.url} autoPlay muted loop playsInline />
              <div className="library-card-body">
                <strong>{item.name}</strong>
                <small className="library-meta">animado/3D</small>
                <button type="button" onClick={() => setAnimatedBackgroundId(item.id)}>
                  usar animado
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {libraryTab !== "animated" && (
        <>
          <div className="library-toolbar">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="buscar por nombre o autor..." />
            {libraryTab === "popular" && (
              <div className="library-categories">
                {categories.map((key) => (
                  <button key={key} type="button" className={category === key ? "active" : ""} onClick={() => setCategory(key)}>
                    {key === "all" ? "todas" : key}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="library-grid">
            {currentItems.length === 0 && <div className="library-empty">No hay fondos en esta seccion todavia.</div>}
            {libraryTab === "popular" &&
              currentItems.map((item) => (
                <article key={item.url} className={`library-card ${backgroundUrl === item.url ? "selected" : ""}`}>
                  <img src={item.url} alt={item.name} />
                  <div className="library-card-body">
                    <strong>{item.name}</strong>
                    <small className="library-meta">{item.category || "otros"}</small>
                    <button type="button" onClick={() => setBackgroundUrl(item.url)}>
                      usar fondo
                    </button>
                  </div>
                </article>
              ))}

            {libraryTab !== "popular" &&
              currentItems.map((item, index) => (
                <article key={item.id} className={`library-card ${backgroundUrl === item.url ? "selected" : ""}`}>
                  <img src={item.url} alt={item.name || `comunidad ${index + 1}`} />
                  <div className="library-card-body">
                    <strong>{item.name || `comunidad ${index + 1}`}</strong>
                    <small>por {item.by || "anon"}</small>
                    <div className="library-actions">
                      <button type="button" onClick={() => setBackgroundUrl(item.url)}>
                        usar
                      </button>
                      <button type="button" onClick={() => likeCommunityBackground(item.id)}>
                        like {item.likes}
                      </button>
                      <button type="button" onClick={() => toggleCommunityFavorite(item.id)}>
                        {item.favorite ? "fav" : "guardar"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </>
      )}
    </section>
  );
}
