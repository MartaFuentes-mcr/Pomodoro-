import { useEffect, useMemo, useState } from "react";
import { TRACKS_BY_CATEGORY } from "../constants/appData";
import { MUSIC_PROVIDER_STORAGE_KEY, YOUTUBE_EMBED_STORAGE_KEY } from "../constants/storageKeys";

const PROVIDER_EMBED_URLS = {
  spotify: "https://open.spotify.com/embed/playlist/6AuKdzUEpokgfoJgfZZdO4?utm_source=generator&theme=0",
};
const DEFAULT_YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1";

function getYouTubeVideoId(rawValue) {
  const value = rawValue.trim();
  if (!value) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.slice(1);
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const directId = url.searchParams.get("v");
      if (directId) return directId;

      const parts = url.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];
      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
    }
  } catch {
    return "";
  }

  return "";
}

function normalizeYouTubeEmbedUrl(rawValue) {
  const videoId = getYouTubeVideoId(rawValue);
  if (!videoId) return "";
  return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}

export default function useMusic() {
  const [musicOn, setMusicOn] = useState(false);
  const [musicProvider, setMusicProvider] = useState("");
  const [musicCategory, setMusicCategory] = useState("focus");
  const [externalPlayerUrl, setExternalPlayerUrl] = useState("");
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState(DEFAULT_YOUTUBE_EMBED_URL);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(35);
  const [audio] = useState(() => new Audio(TRACKS_BY_CATEGORY.focus[0].url));

  const availableTracks = useMemo(() => TRACKS_BY_CATEGORY[musicCategory] ?? [], [musicCategory]);
  const currentTrackData = availableTracks[currentTrack] ?? availableTracks[0] ?? null;

  useEffect(() => {
    if (availableTracks.length === 0) return;
    audio.loop = false;
    audio.volume = volume / 100;
    const onEnded = () => setCurrentTrack((i) => (i + 1) % availableTracks.length);
    const onError = () => setCurrentTrack((i) => (i + 1) % availableTracks.length);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio, volume, availableTracks.length]);

  useEffect(() => {
    if (musicProvider) {
      audio.pause();
      return;
    }
    if (!currentTrackData || currentTrackData.type !== "audio") {
      audio.pause();
      return;
    }
    audio.pause();
    audio.src = currentTrackData.url;
    audio.currentTime = 0;
    if (musicOn) audio.play().catch(() => setMusicOn(false));
  }, [audio, currentTrackData, musicOn, musicProvider]);

  useEffect(() => {
    setCurrentTrack(0);
    setExternalPlayerUrl("");
  }, [musicCategory]);

  useEffect(() => {
    if (musicProvider && PROVIDER_EMBED_URLS[musicProvider]) {
      setExternalPlayerUrl(PROVIDER_EMBED_URLS[musicProvider]);
      return;
    }
    if (musicProvider === "youtube") {
      setExternalPlayerUrl(youtubeEmbedUrl || DEFAULT_YOUTUBE_EMBED_URL);
      return;
    }

    if (!musicOn) {
      setExternalPlayerUrl("");
      return;
    }

    if (currentTrackData?.type === "external") {
      setExternalPlayerUrl(currentTrackData.embedUrl || "");
      return;
    }

    setExternalPlayerUrl("");
  }, [currentTrackData, musicOn, musicProvider, youtubeEmbedUrl]);

  useEffect(() => {
    const savedProvider = localStorage.getItem(MUSIC_PROVIDER_STORAGE_KEY);
    if (savedProvider) setMusicProvider(savedProvider);
    const savedYoutubeEmbed = localStorage.getItem(YOUTUBE_EMBED_STORAGE_KEY);
    if (savedYoutubeEmbed) setYoutubeEmbedUrl(savedYoutubeEmbed);

    const params = new URLSearchParams(window.location.search);
    const providerFromCallback = params.get("music_provider");
    if (providerFromCallback === "spotify" || providerFromCallback === "youtube") {
      setMusicProvider(providerFromCallback);
      localStorage.setItem(MUSIC_PROVIDER_STORAGE_KEY, providerFromCallback);
      params.delete("music_provider");
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, []);

  async function toggleMusic() {
    if (!currentTrackData) return;
    if (musicProvider || currentTrackData.type === "external") {
      setMusicOn((prev) => !prev);
      return;
    }
    if (musicOn) {
      audio.pause();
      setMusicOn(false);
      return;
    }
    try {
      await audio.play();
      setMusicOn(true);
    } catch {
      alert("No se pudo iniciar el audio. Intenta de nuevo.");
    }
  }

  function changeTrack(delta) {
    if (availableTracks.length === 0) return;
    setCurrentTrack((i) => (i + delta + availableTracks.length) % availableTracks.length);
  }

  function connectMusicProvider(provider) {
    if (provider !== "spotify" && provider !== "youtube") return;
    setMusicProvider(provider);
    localStorage.setItem(MUSIC_PROVIDER_STORAGE_KEY, provider);
    audio.pause();
    setMusicOn(true);
  }

  function setCustomYouTubeTrack(rawUrl) {
    const embedUrl = normalizeYouTubeEmbedUrl(rawUrl || "");
    if (!embedUrl) return false;
    setYoutubeEmbedUrl(embedUrl);
    localStorage.setItem(YOUTUBE_EMBED_STORAGE_KEY, embedUrl);
    setMusicProvider("youtube");
    localStorage.setItem(MUSIC_PROVIDER_STORAGE_KEY, "youtube");
    audio.pause();
    setMusicOn(true);
    return true;
  }

  function disconnectMusicProvider() {
    setMusicOn(false);
    setExternalPlayerUrl("");
    setMusicProvider("");
    localStorage.removeItem(MUSIC_PROVIDER_STORAGE_KEY);
  }

  return {
    musicOn,
    musicProvider,
    musicCategory,
    setMusicCategory,
    externalPlayerUrl,
    currentTrack,
    setCurrentTrack,
    volume,
    setVolume,
    availableTracks,
    currentTrackData,
    toggleMusic,
    changeTrack,
    connectMusicProvider,
    setCustomYouTubeTrack,
    disconnectMusicProvider,
  };
}
