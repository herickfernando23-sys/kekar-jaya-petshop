export function AnimatedStripeBand() {
  return (
    <section className="relative left-1/2 right-1/2 mt-10 sm:mt-14 lg:mt-16 w-screen -translate-x-1/2 overflow-hidden">
      <div className="overflow-hidden border-y border-orange-100 bg-white/75 backdrop-blur-sm shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
        <svg
          className="block h-16 w-full sm:h-20"
          viewBox="0 0 1600 72"
          preserveAspectRatio="none"
          role="img"
          aria-label="Strip animasi bertema kucing"
        >
          <defs>
            <clipPath id="hero-stripe-clip">
              <rect x="0" y="0" width="1600" height="72" rx="0" ry="0" />
            </clipPath>
            <linearGradient id="cat-background" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fff7ed" />
              <stop offset="50%" stopColor="#fffaf4" />
              <stop offset="100%" stopColor="#fff1e7" />
            </linearGradient>
          </defs>
          <g clipPath="url(#hero-stripe-clip)">
            <rect width="1600" height="72" fill="url(#cat-background)" />
            <g opacity="0.9">
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="0 0"
                  to="-380 0"
                  dur="14s"
                  repeatCount="indefinite"
                />
                {Array.from({ length: 22 }).map((_, index) => (
                  <image
                    key={`pattern-tile-a-${index}`}
                    href="https://static.vecteezy.com/system/resources/previews/006/431/810/non_2x/seamless-dog-pattern-with-paw-prints-cat-foots-texture-pattern-with-doggy-pawprints-dog-texture-hand-drawn-illustration-in-doodle-style-on-white-background-vector.jpg"
                    x={index * 380}
                    y="0"
                    width="380"
                    height="72"
                    opacity="0.9"
                    preserveAspectRatio="xMidYMid slice"
                  />
                ))}
                {Array.from({ length: 22 }).map((_, index) => (
                  <image
                    key={`pattern-tile-b-${index}`}
                    href="https://static.vecteezy.com/system/resources/previews/006/431/810/non_2x/seamless-dog-pattern-with-paw-prints-cat-foots-texture-pattern-with-doggy-pawprints-dog-texture-hand-drawn-illustration-in-doodle-style-on-white-background-vector.jpg"
                    x={9460 + index * 430}
                    y="0"
                    width="430"
                    height="72"
                    opacity="0.9"
                    preserveAspectRatio="xMidYMid slice"
                  />
                ))}
              </g>
            </g>
          </g>
        </svg>
      </div>
    </section>
  );
}