import { useEffect, useMemo, useRef, useState } from "react";
import { ANIMATED_BACKGROUNDS, BACKGROUNDS } from "../constants/appData";
import { ANIMATED_BG_STORAGE_KEY, COMMUNITY_STORAGE_KEY } from "../constants/storageKeys";

const MAX_COMMUNITY_ITEMS = 40;

function makeEntry(url, extras = {}) {
  return {
    id: extras.id || `bg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    url,
    name: extras.name || "fondo comunidad",
    by: extras.by || "anon",
    likes: Number.isFinite(extras.likes) ? Math.max(0, Math.floor(extras.likes)) : 0,
    favorite: !!extras.favorite,
    createdAt: extras.createdAt || new Date().toISOString(),
  };
}

function normalizeStorage(raw) {
  if (!raw || typeof raw !== "object") return { entries: [] };
  if (Array.isArray(raw)) {
    return {
      entries: raw.filter((v) => typeof v === "string").map((url, idx) => makeEntry(url, { name: `comunidad ${idx + 1}` })),
    };
  }
  if (Array.isArray(raw.entries)) {
    return {
      entries: raw.entries
        .filter((item) => item && typeof item.url === "string" && item.url.trim())
        .map((item) => makeEntry(item.url.trim(), item)),
    };
  }
  return { entries: [] };
}

export default function useBackgrounds() {
  const [backgroundUrl, setBackgroundUrl] = useState(BACKGROUNDS[0].url);
  const [customBackground, setCustomBackground] = useState("");
  const [bgTab, setBgTab] = useState("popular");
  const [animatedBackgroundId, setAnimatedBackgroundId] = useState("");
  const [communityBackgrounds, setCommunityBackgrounds] = useState([]);
  const [communityFilter, setCommunityFilter] = useState("all");
  const [communityOwner, setCommunityOwner] = useState("Marta");
  const [communityMessage, setCommunityMessage] = useState("");
  const importInputRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMMUNITY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const normalized = normalizeStorage(parsed);
      setCommunityBackgrounds(normalized.entries.slice(0, MAX_COMMUNITY_ITEMS));
    } catch {
      setCommunityBackgrounds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify({ entries: communityBackgrounds }));
  }, [communityBackgrounds]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ANIMATED_BG_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.id === "string") setAnimatedBackgroundId(parsed.id);
    } catch {
      setAnimatedBackgroundId("");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ANIMATED_BG_STORAGE_KEY, JSON.stringify({ id: animatedBackgroundId }));
  }, [animatedBackgroundId]);

  const visibleCommunityBackgrounds = useMemo(() => {
    if (communityFilter === "favorites") return communityBackgrounds.filter((item) => item.favorite);
    return communityBackgrounds;
  }, [communityBackgrounds, communityFilter]);
  const animatedBackground = useMemo(
    () => ANIMATED_BACKGROUNDS.find((item) => item.id === animatedBackgroundId) || null,
    [animatedBackgroundId]
  );

  function upsertCommunityBackground(url, extras = {}) {
    if (!url) return;
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    setCommunityBackgrounds((items) => {
      const existing = items.find((item) => item.url === cleanUrl);
      if (existing) {
        const updated = { ...existing, ...extras, url: cleanUrl };
        return [updated, ...items.filter((item) => item.id !== existing.id)].slice(0, MAX_COMMUNITY_ITEMS);
      }
      const entry = makeEntry(cleanUrl, extras);
      return [entry, ...items].slice(0, MAX_COMMUNITY_ITEMS);
    });
  }

  function applyCustomBackground() {
    if (!customBackground.trim()) return;
    const source = customBackground.trim();
    setBackgroundUrl(source);
    upsertCommunityBackground(source, { name: "desde URL", by: communityOwner || "anon" });
    setCustomBackground("");
  }

  function handleCommunityUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      upsertCommunityBackground(result, { name: file.name || "subido", by: communityOwner || "anon" });
      setBackgroundUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function toggleCommunityFavorite(id) {
    setCommunityBackgrounds((items) => items.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item)));
  }

  function likeCommunityBackground(id) {
    setCommunityBackgrounds((items) => items.map((item) => (item.id === id ? { ...item, likes: item.likes + 1 } : item)));
  }

  function removeCommunityBackground(id) {
    setCommunityBackgrounds((items) => items.filter((item) => item.id !== id));
  }

  function clearAnimatedBackground() {
    setAnimatedBackgroundId("");
  }

  function exportCommunityGallery() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: communityBackgrounds.map((item) => ({
        url: item.url,
        name: item.name,
        by: item.by,
        likes: item.likes,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "study-sanctuary-community-gallery.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setCommunityMessage("Galeria exportada.");
  }

  async function importCommunityGallery(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = Array.isArray(parsed) ? parsed : parsed?.entries;
      if (!Array.isArray(incoming)) {
        setCommunityMessage("JSON invalido.");
        return;
      }
      let imported = 0;
      setCommunityBackgrounds((items) => {
        const next = [...items];
        incoming.forEach((item) => {
          if (!item || typeof item.url !== "string" || !item.url.trim()) return;
          const url = item.url.trim();
          const foundIndex = next.findIndex((row) => row.url === url);
          if (foundIndex >= 0) {
            next[foundIndex] = {
              ...next[foundIndex],
              name: item.name || next[foundIndex].name,
              by: item.by || next[foundIndex].by,
              likes: Math.max(next[foundIndex].likes, Number(item.likes) || 0),
            };
          } else {
            next.unshift(makeEntry(url, { name: item.name, by: item.by, likes: Number(item.likes) || 0 }));
            imported += 1;
          }
        });
        return next.slice(0, MAX_COMMUNITY_ITEMS);
      });
      setCommunityMessage(`Importacion lista. Nuevos: ${imported}.`);
      if (importInputRef.current) importInputRef.current.value = "";
    } catch {
      setCommunityMessage("No se pudo importar.");
    }
  }

  return {
    backgroundUrl,
    setBackgroundUrl,
    customBackground,
    setCustomBackground,
    bgTab,
    setBgTab,
    animatedBackgroundId,
    setAnimatedBackgroundId,
    animatedBackground,
    animatedBackgrounds: ANIMATED_BACKGROUNDS,
    communityBackgrounds: visibleCommunityBackgrounds,
    allCommunityBackgrounds: communityBackgrounds,
    favoriteCommunityBackgrounds: communityBackgrounds.filter((item) => item.favorite),
    communityCount: communityBackgrounds.length,
    communityFilter,
    setCommunityFilter,
    communityOwner,
    setCommunityOwner,
    communityMessage,
    setCommunityMessage,
    importInputRef,
    applyCustomBackground,
    handleCommunityUpload,
    toggleCommunityFavorite,
    likeCommunityBackground,
    removeCommunityBackground,
    clearAnimatedBackground,
    exportCommunityGallery,
    importCommunityGallery,
  };
}
