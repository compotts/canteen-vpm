import { useId } from "react";

export function WinterLunchArt() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 560 350"
      fill="none"
      aria-hidden="true"
      className="login-lunch-art"
    >
      <defs>
        <filter
          id={`${id}-shadow`}
          x="-30%"
          y="-30%"
          width="160%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="14"
            floodColor="#223e2d"
            floodOpacity=".13"
          />
        </filter>
        <linearGradient
          id={`${id}-plate`}
          x1="185"
          y1="70"
          x2="370"
          y2="290"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--login-plate)" />
          <stop offset="1" stopColor="var(--login-plate-edge)" />
        </linearGradient>
      </defs>
      <ellipse
        cx="275"
        cy="286"
        rx="132"
        ry="20"
        fill="#1b3722"
        opacity=".06"
      />
      <g filter={`url(#${id}-shadow)`}>
        <circle cx="275" cy="175" r="124" fill={`url(#${id}-plate)`} />
        <circle cx="275" cy="175" r="108" stroke="#c3c2a7" strokeOpacity=".5" />
        <circle cx="275" cy="175" r="88" fill="var(--login-plate-center)" />
        <path
          d="M228 131c-23 11-29 45-15 62 16 20 53 21 71 5 16-13 12-44-7-57-15-11-34-18-49-10Z"
          fill="#c17745"
        />
        <path
          d="M227 139c-14 9-17 30-8 43 12 17 41 16 55 3 11-10 7-30-8-39-14-7-27-14-39-7Z"
          fill="#d4925f"
        />
        <path
          d="m226 151 40 18m-43-3 32 14"
          stroke="#ad643b"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".65"
        />
        <path
          d="M289 137c13-20 26-25 38-23 5 14-2 30-20 36-10 5-15 2-18-13Z"
          fill="#6e8246"
        />
        <path
          d="M309 152c15-9 31-5 35 8-9 18-22 22-35 11-6-7-7-13 0-19Z"
          fill="#8e9d55"
        />
        <path
          d="M298 174c18-5 28 5 25 19-11 14-27 14-34 2-5-11-2-17 9-21Z"
          fill="#557640"
        />
        <path
          d="m300 145 17-17m-3 36 17-3m-32 24 12 7"
          stroke="#b8c188"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <ellipse
          cx="262"
          cy="221"
          rx="19"
          ry="13"
          transform="rotate(-20 262 221)"
          fill="#e4c780"
        />
        <ellipse
          cx="291"
          cy="221"
          rx="17"
          ry="13"
          transform="rotate(17 291 221)"
          fill="#e9d399"
        />
        <path
          d="m254 219 10-4m22 4 8 5"
          stroke="#c6a85f"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="305" cy="115" r="5" fill="#b9573d" />
        <circle cx="335" cy="194" r="6" fill="#c86943" />
        <path
          d="m238 114 3-8m2 11 7-3m28 101 3-7m-3-5 8 2"
          stroke="#586c3e"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      <g stroke="var(--login-cutlery)" strokeWidth="4" strokeLinecap="round">
        <path d="M109 104v50c0 11 20 11 20 0v-50m-10 0v62m0 0v92" />
        <path d="M431 104c-13 0-18 15-18 29 0 17 8 28 18 28s18-11 18-28c0-14-5-29-18-29Zm0 57v97" />
      </g>
      <g
        transform="rotate(-22 112 54)"
        stroke="var(--login-pine)"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M41 85 164 37m-95 37-20-13m32 9-18-17m29 12-13-20m27 15-11-21m23 17-6-20m16 16-1-17M69 74l-7 21m20-25-4 22m16-27 1 22m12-27 7 19m6-24 9 15m1-19 9 10" />
      </g>
      <circle cx="76" cy="58" r="7" fill="#ba6249" />
      <circle cx="91" cy="48" r="5" fill="#ba6249" />
      <path
        d="m458 42 2 9 9 2-9 2-2 9-2-9-9-2 9-2 2-9ZM76 238l3 12 12 3-12 3-3 12-3-12-12-3 12-3 3-12Z"
        fill="#b3914f"
      />
      <circle cx="478" cy="86" r="3" fill="#b3914f" opacity=".7" />
      <circle cx="65" cy="184" r="2.5" fill="#b3914f" opacity=".7" />
      <g transform="translate(407 239)">
        <ellipse cx="30" cy="41" rx="41" ry="8" fill="#1b3722" opacity=".08" />
        <path
          d="M52 6h8c18 0 18 24 0 24h-7"
          stroke="var(--login-cup)"
          strokeWidth="7"
        />
        <path
          d="M5 0h53v26c0 12-10 17-26 17S5 38 5 26V0Z"
          fill="var(--login-cup)"
        />
        <ellipse cx="31.5" cy="1" rx="26.5" ry="7" fill="#b9c6a0" />
        <ellipse cx="31.5" cy="2" rx="20" ry="4" fill="#73563f" />
        <path
          d="M23-15c-10-10 12-12 3-24m15 24c-10-10 12-12 3-24"
          stroke="var(--login-cutlery)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".5"
        />
      </g>
    </svg>
  );
}
