/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface FlixGhostIconProps {
  className?: string;
  glow?: boolean;
}

export default function FlixGhostIcon({ className = "w-16 h-16", glow = true }: FlixGhostIconProps) {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Glow Filter for the entire ghost body and details */}
        {glow && (
          <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
        
        {/* Linear Gradients matching the teal/blue/neon palette */}
        <linearGradient id="ghost-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" /> {/* cyan-400 */}
          <stop offset="50%" stopColor="#06b6d4" /> {/* cyan-500 */}
          <stop offset="100%" stopColor="#0891b2" /> {/* cyan-600 */}
        </linearGradient>

        <linearGradient id="ghost-body-grad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#083344" stopOpacity="0.85" /> {/* dark cyan */}
          <stop offset="100%" stopColor="#020617" stopOpacity="0.95" /> {/* very dark slate */}
        </linearGradient>
      </defs>
      
      {/* Ghost Main Body with beautiful bezier curves */}
      <g filter={glow ? "url(#neon-glow)" : undefined}>
        {/* Trailing energy tails */}
        {/* Upper trail */}
        <path 
          d="M 60 70 C 45 70, 35 80, 25 75 C 35 65, 50 60, 65 65 Z" 
          fill="url(#ghost-grad)" 
          opacity="0.7"
        />
        {/* Mid-upper trail */}
        <path 
          d="M 50 90 C 30 85, 20 100, 10 95 C 22 83, 38 78, 55 83 Z" 
          fill="url(#ghost-grad)" 
          opacity="0.85"
        />
        {/* Main large center trail */}
        <path 
          d="M 45 115 C 20 110, 12 135, 2 125 C 15 105, 35 100, 50 110 Z" 
          fill="url(#ghost-grad)"
        />
        {/* Lower trail */}
        <path 
          d="M 62 138 C 45 142, 35 160, 25 152 C 34 138, 50 130, 68 134 Z" 
          fill="url(#ghost-grad)" 
          opacity="0.75"
        />
        {/* Bottom trailing spark */}
        <path 
          d="M 85 155 C 72 165, 65 178, 58 172 C 64 160, 75 150, 88 150 Z" 
          fill="url(#ghost-grad)" 
          opacity="0.6"
        />

        {/* Core outer stroke and inner fill of the head/torso */}
        <path 
          d="M 130 35 
             C 175 35, 195 75, 185 115 
             C 175 150, 135 160, 100 150
             C 85 145, 75 130, 70 115
             C 65 95, 75 75, 90 55
             C 100 45, 115 35, 130 35 Z" 
          fill="url(#ghost-body-grad)"
          stroke="url(#ghost-grad)"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Two glowing eyes */}
        <circle cx="146" cy="74" r="10.5" fill="#22d3ee" />
        <circle cx="170" cy="78" r="10.5" fill="#22d3ee" />
        
        {/* High-tech internal detailing details */}
        <path 
          d="M 105 85 Q 115 105 135 115 Q 150 120 165 110" 
          stroke="url(#ghost-grad)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          opacity="0.35" 
        />
        <path 
          d="M 118 70 Q 128 82 142 85" 
          stroke="url(#ghost-grad)" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          opacity="0.25" 
        />
      </g>
    </svg>
  );
}
