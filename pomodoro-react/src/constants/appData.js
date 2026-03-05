export const MODES = {
  pomodoro: { label: "pomodoro" },
  short: { label: "breve descanso" },
  long: { label: "descanso largo" },
};

export const BACKGROUNDS = [
  {
    name: "alpes amanecer",
    category: "montana",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "lago glaciar",
    category: "montana",
    url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "bosque neblina",
    category: "bosque",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "costa serena",
    category: "mar",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "desierto dorado",
    category: "desierto",
    url: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "valle verde",
    category: "bosque",
    url: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "noche urbana",
    category: "ciudad",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "ciudad lluvia",
    category: "ciudad",
    url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "olas profundas",
    category: "mar",
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "aurora boreal",
    category: "noche",
    url: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "luna sobre lago",
    category: "noche",
    url: "https://images.unsplash.com/photo-1507400492013-162706c8c05e?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "minimal claro",
    category: "minimal",
    url: "https://images.unsplash.com/photo-1493244040629-496f6d136cc3?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "minimal arena",
    category: "minimal",
    url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "bosque otoñal",
    category: "bosque",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=80",
  },
  {
    name: "picos nevados",
    category: "montana",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2600&q=80",
  },
];

export const ANIMATED_BACKGROUNDS = [
  {
    id: "mario",
    name: "Mario Animated",
    url: "/videos/mario-animated.mp4",
  },
  {
    id: "bmw",
    name: "BMW M4 Liberty Walk",
    url: "/videos/bmw-m4-liberty-walk.mp4",
  },
  {
    id: "lofi-midnight",
    name: "Lo-Fi Glow Midnight Room",
    url: "/videos/lofi-glow-midnight.mp4",
  },
  {
    id: "minecraft-winter",
    name: "Minecraft Winter Lantern Night",
    url: "/videos/minecraft-winter-lantern-night.mp4",
  },
  {
    id: "spider-man-silent",
    name: "Spider-Man Silent",
    url: "/videos/spider-man-silent.mp4",
  },
];

export const TRACKS_BY_CATEGORY = {
  focus: [
    { name: "Focus Flow", type: "audio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { name: "Deep Work", type: "audio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { name: "Lo-Fi Breeze", type: "audio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  ],
  piano: [
    {
      name: "Birds of a Feather (Piano Cover)",
      type: "external",
      embedUrl: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1",
    },
    {
      name: "Espresso (Piano Cover)",
      type: "audio",
      url: "https://soundimage.org/wp-content/uploads/2022/04/Going-Different-Ways_Remixed.mp3",
    },
    {
      name: "Fortnight (Piano Cover)",
      type: "audio",
      url: "https://soundimage.org/wp-content/uploads/2015/03/Stage-Door.mp3",
    },
    {
      name: "Die With A Smile (Piano Cover)",
      type: "external",
      embedUrl: "https://www.youtube.com/embed/lTRiuFIWV54?autoplay=1",
    },
  ],
};
