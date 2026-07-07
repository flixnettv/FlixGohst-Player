/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlaylistItem, SeriesEpisode } from '../types';

export const DEMO_CHANNELS: PlaylistItem[] = [
  // LIVE TV CHANNELS
  {
    id: "demo-live-1",
    name: "NASA TV Public HD",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg",
    url: "https://ntv1.akamaized.net/hls/live/2014027/NASA-NTV1-HLS/master.m3u8",
    group: "Documentaries & Space (وثائقيات)",
    type: "live"
  },
  {
    id: "demo-live-2",
    name: "NASA TV Media Channel",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/15/NASA_logo_black.svg",
    url: "https://ntv2.akamaized.net/hls/live/2014028/NASA-NTV2-HLS/master.m3u8",
    group: "Documentaries & Space (وثائقيات)",
    type: "live"
  },
  {
    id: "demo-live-3",
    name: "DW English News Live",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Deutsche_Welle_logo.svg",
    url: "https://dwstream4-lh.akamaihd.net/i/dwstream4_live@131329/master.m3u8",
    group: "News & Events (الأخبار)",
    type: "live"
  },
  {
    id: "demo-live-4",
    name: "France 24 English",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/82/France_24_logo.svg",
    url: "https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8",
    group: "News & Events (الأخبار)",
    type: "live"
  },
  {
    id: "demo-live-5",
    name: "Al Jazeera English",
    logo: "https://upload.wikimedia.org/wikipedia/en/2/22/Al_Jazeera_English_logo.svg",
    url: "https://live-lh.aljazeera.net/i/aljazeera_en@124016/master.m3u8",
    group: "News & Events (الأخبار)",
    type: "live"
  },
  {
    id: "demo-live-6",
    name: "Red Bull TV Live",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/e8/Red_Bull_TV_logo.svg",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/Sports/master.m3u8",
    group: "Sports & Action (الرياضة)",
    type: "live"
  },

  // MOVIES (VOD)
  {
    id: "demo-mov-1",
    name: "Sintel (CGI Animation)",
    logo: "https://durian.blender.org/wp-content/uploads/2010/05/sintel_poster_v2_small.jpg",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    group: "Sci-Fi & Animation",
    type: "movie",
    rating: "8.1/10",
    releaseDate: "2010",
    duration: "14 min 48 sec",
    director: "Colin Levy",
    plot: "Sintel is an independent film, produced by the Blender Foundation, about a lonely girl who is seeking her dragon companion in a fantasy world. High-quality visuals and moving storytelling.",
    backdrop: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop"
  },
  {
    id: "demo-mov-2",
    name: "Tears of Steel (Sci-Fi Movie)",
    logo: "https://mango.blender.org/wp-content/uploads/2012/09/teears_of_steel_poster_small.jpg",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    group: "Sci-Fi & Animation",
    type: "movie",
    rating: "7.6/10",
    releaseDate: "2012",
    duration: "12 min 14 sec",
    director: "Ian Hubert",
    plot: "Set in an apocalyptic Amsterdam, Tears of Steel exploring a futuristic world of giant robots, cybernetic elements, and romantic drama. Excellent test bed for full surround sound and vivid effects.",
    backdrop: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop"
  },
  {
    id: "demo-mov-3",
    name: "Big Buck Bunny (Comedy)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_Buck_Bunny_%E5%A0%85%E5%AE%9A%E7%9A%84%E9%8 Tin%E5%85%B5.png",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    group: "Comedy & Family",
    type: "movie",
    rating: "7.2/10",
    releaseDate: "2008",
    duration: "9 min 56 sec",
    director: "Jan Morgenstern",
    plot: "A giant, fluffy rabbit seeks revenge on three pesky woodland creatures who have ruined his beloved garden and forest sanctuary. A classic, funny, and beautifully animated short story.",
    backdrop: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=1200&auto=format&fit=crop"
  },

  // SERIES (VOD) - REPRESENTING AS PARENT ITEMS IN APP
  {
    id: "demo-ser-1",
    name: "Blender Chronicles (The Series)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Blender_logo_no_text.svg",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Default episode URL
    group: "Web Series",
    type: "series",
    rating: "8.5/10",
    releaseDate: "2024",
    duration: "1 Season • 3 Episodes",
    director: "Blender Community",
    plot: "Follow the magnificent adventure of computer-generated actors across different cinematic worlds. Every episode presents a unique, jaw-dropping technological showcase of narrative and art.",
    backdrop: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop"
  }
];

// EPISODES for series
export const DEMO_EPISODES: Record<string, SeriesEpisode[]> = {
  "demo-ser-1": [
    {
      id: "demo-ep-1",
      name: "Elephant's Dream (الفيلم الحالم)",
      seasonNum: 1,
      episodeNum: 1,
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      logo: "https://orange.blender.org/wp-content/themes/orange/images/header_left.jpg",
      plot: "Episode 1: Two eccentric travelers search inside a massive, mechanical world looking for meaning and escape. The first open-source animated series episode.",
      duration: "10 min"
    },
    {
      id: "demo-ep-2",
      name: "For Bigger Blazes (الوميض الأكبر)",
      seasonNum: 1,
      episodeNum: 2,
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      logo: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=300",
      plot: "Episode 2: A dazzling, fast-paced technical showpiece of fires, blazes, and action set-pieces inside high-definition CG landscapes.",
      duration: "15 sec"
    },
    {
      id: "demo-ep-3",
      name: "For Bigger Escapes (الهروب الكبير)",
      seasonNum: 1,
      episodeNum: 3,
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      logo: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300",
      plot: "Episode 3: The thrilling series finale exploring open roads, high-speed travel, and stunning vistas of pure digital creation.",
      duration: "15 sec"
    }
  ]
};

