/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlaylistType = 'm3u' | 'xtream';

export interface BasePlaylist {
  id: string;
  name: string;
  type: PlaylistType;
  createdAt: string;
  lastUpdated: string;
}

export interface M3uPlaylist extends BasePlaylist {
  type: 'm3u';
  url: string;
}

export interface XtreamPlaylist extends BasePlaylist {
  type: 'xtream';
  host: string;
  username: string;
  password?: string; // Stored securely/obfuscated or hashed
}

export type Playlist = M3uPlaylist | XtreamPlaylist;

export type PlaylistItemType = 'live' | 'movie' | 'series';

export interface PlaylistItem {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
  type: PlaylistItemType;
  // Xtream Codes or advanced properties
  streamId?: string;
  rating?: string;
  releaseDate?: string;
  duration?: string;
  director?: string;
  plot?: string;
  backdrop?: string;
  cast?: string;
}

export interface SeriesEpisode {
  id: string;
  name: string;
  seasonNum: number;
  episodeNum: number;
  url: string;
  logo?: string;
  plot?: string;
  duration?: string;
}

export interface SeriesSeason {
  seasonNum: number;
  episodes: SeriesEpisode[];
}

export interface SeriesDetail extends PlaylistItem {
  seasons: SeriesSeason[];
}

export interface CategoryGroup {
  name: string;
  count: number;
  type: PlaylistItemType;
}

export interface AppSettings {
  language: 'ar' | 'en';
  theme: 'blue' | 'emerald' | 'crimson' | 'onyx';
  parentalPin: string;
  parentalEnabled: boolean;
  lockedGroups: string[];
  defaultAspectRatio: 'auto' | '16:9' | '4:3' | 'cover';
  bufferSize: number; // in seconds
}

export interface DeviceInfo {
  macAddress: string;
  deviceKey: string;
  expiryDate: string;
  isActivated: boolean;
  playlistCount: number;
}

export interface ActivePlayback {
  item: PlaylistItem;
  playlistId: string;
  index: number;
  streamUrl: string;
  startTime?: number; // for resume play
  seasonNum?: number;  // for series
  episodeId?: string;  // for series
}
