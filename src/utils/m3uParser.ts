/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlaylistItem, PlaylistItemType } from '../types';

export function parseM3U(m3uContent: string): PlaylistItem[] {
  const items: PlaylistItem[] = [];
  const lines = m3uContent.split('\n');
  
  let currentExtInf: {
    name: string;
    logo: string;
    group: string;
    tvgId: string;
  } | null = null;

  const attributeRegex = /(\w+[-_]?\w*)="([^"]*)"/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF line
      let name = '';
      let logo = '';
      let group = '';
      let tvgId = '';

      // Extract comma-separated name at the end of the line
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        name = line.substring(commaIndex + 1).trim();
      }

      // Reset regex state
      attributeRegex.lastIndex = 0;
      let match;
      const attributes: Record<string, string> = {};
      
      while ((match = attributeRegex.exec(line)) !== null) {
        attributes[match[1].toLowerCase()] = match[2];
      }

      logo = attributes['tvg-logo'] || attributes['logo'] || '';
      group = attributes['group-title'] || attributes['group'] || '';
      tvgId = attributes['tvg-id'] || attributes['id'] || '';

      // Clean group names (some files have empty or generic values)
      if (!group) {
        group = 'Other';
      }

      currentExtInf = { name, logo, group, tvgId };
    } else if (line && !line.startsWith('#')) {
      // This is the URL line
      if (currentExtInf) {
        const url = line;
        
        // Dynamic type detection based on URL and group title
        let type: PlaylistItemType = 'live';
        const lowerUrl = url.toLowerCase();
        const lowerGroup = currentExtInf.group.toLowerCase();
        const lowerName = currentExtInf.name.toLowerCase();

        const isVOD = 
          lowerUrl.endsWith('.mp4') || 
          lowerUrl.endsWith('.mkv') || 
          lowerUrl.endsWith('.avi') ||
          lowerUrl.includes('/movie/') ||
          lowerGroup.includes('movie') || 
          lowerGroup.includes('cinema') || 
          lowerGroup.includes('vod') ||
          lowerGroup.includes('أفلام') || 
          lowerGroup.includes('افلام');

        const isSeries = 
          lowerUrl.includes('/series/') || 
          lowerGroup.includes('series') || 
          lowerGroup.includes('show') || 
          lowerGroup.includes('مسلسلات') || 
          lowerName.includes('s01') || 
          lowerName.includes('s02') || 
          lowerName.includes('s03') ||
          /s\d{1,2}e\d{1,2}/.test(lowerName);

        if (isSeries) {
          type = 'series';
        } else if (isVOD) {
          type = 'movie';
        }

        // Clean up empty names
        const finalName = currentExtInf.name || url.substring(url.lastIndexOf('/') + 1) || 'Unknown Channel';

        items.push({
          id: `ch-${Math.random().toString(36).substring(2, 11)}`,
          name: finalName,
          logo: currentExtInf.logo,
          url: url,
          group: currentExtInf.group,
          type: type
        });

        currentExtInf = null;
      }
    }
  }

  return items;
}
