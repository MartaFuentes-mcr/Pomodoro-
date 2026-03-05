import { useEffect, useMemo, useState } from "react";
import { TRACKS_BY_CATEGORY } from "../constants/appData";
import { MUSIC_PROVIDER_STORAGE_KEY } from "../constants/storageKeys";

export default function useMusic() {
  const [musicOn, setMusicOn] = useState(false);
  const [musicProvider, setMusicProvider] = useState("");
  const [musicCategory, setMusicCategory] = useState("focus");
  const [externalPlayerUrl, setExternalPlayerUrl] = useState("");
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
    if (!currentTrackData || currentTrackData.type !== "audio") {
      audio.pause();
      return;
    }
    audio.pause();
    audio.src = currentTrackData.url;
    audio.currentTime = 0;
    if (musicOn) audio.play().catch(() => setMusicOn(false));
  }, [audio, currentTrackData, musicOn]);

  useEffect(() => {
    setCurrentTrack(0);
    setExternalPlayerUrl("");
  }, [musicCategory]);

  useEffect(() => {
    if (!currentTrackData || currentTrackData.type !== "external") {
      setExternalPlayerUrl("");
      return;
    }
    setExternalPlayerUrl(musicOn ? currentTrackData.embedUrl || "" : "");
  }, [currentTrackData, musicOn]);

  useEffect(() => {
    const savedProvider = localStorage.getItem(MUSIC_PROVIDER_STORAGE_KEY);
    if (savedProvider) setMusicProvider(savedProvider);

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
    if (currentTrackData.type === "external") {
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
    const envKey = provider === "spotify" ? "VITE_SPOTIFY_AUTH_URL" : "VITE_YTM_AUTH_URL";
    const authUrl = import.meta.env[envKey];
    if (!authUrl) {
      alert(`Falta configurar ${envKey} en tu .env para conectar ${provider}.`);
      return;
    }
    window.location.href = authUrl;
  }

  function disconnectMusicProvider() {
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
    disconnectMusicProvider,
  };
}
