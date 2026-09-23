/* Add this immediately so the hero can be armed before the page paints */
document.documentElement.classList.add('bm-motion');

document.addEventListener('DOMContentLoaded', function () {

  /* ==========================================================
     HERO ANIMATION
     SHUTTER + PREVIOUS ZOOM + BLUR + SAND PARTICLES
   ========================================================== */

  var hero = document.getElementById('top');

  if (hero) {

    /* Remove the date line from the hero metadata. */
    var heroDate = hero.querySelector('.hero__when');
    if (heroDate) {
      heroDate.remove();
    }

    var reduce =
      window.matchMedia &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    var heroPlayed = false;
    var heroTimer = null;
    var swirlFx = null;
    var fastFx = null;

    hero.classList.remove(
      'is-armed',
      'is-playing',
      'is-done',
      'bm-new-playing',
      'bm-new-done'
    );

    function buildHeroFx() {

      var heroArt =
        hero.querySelector(
          '.hero__art'
        );

      if (!heroArt) {
        return;
      }

      var existing =
        heroArt.querySelector(
          '.hero__fx'
        );

      if (existing) {
        existing.remove();
      }

      var fx = document.createElement('div');
      fx.className = 'hero__fx';
      fx.setAttribute('aria-hidden', 'true');

      var grade = document.createElement('div');
      grade.className = 'hero__grade';

      var swirl = document.createElement('canvas');
      swirl.className = 'hero__swirl';

      var fast = document.createElement('canvas');
      fast.className = 'hero__fast';

      var devilA = document.createElement('div');
      devilA.className = 'hero__devil hero__devil--a';

      var devilB = document.createElement('div');
      devilB.className = 'hero__devil hero__devil--b';

      var streak = document.createElement('div');
      streak.className = 'hero__streak';

      var vignette = document.createElement('div');
      vignette.className = 'hero__vignette';

      fx.appendChild(grade);
      fx.appendChild(swirl);
      fx.appendChild(fast);
      fx.appendChild(devilA);
      fx.appendChild(devilB);
      fx.appendChild(streak);
      fx.appendChild(vignette);

      heroArt.appendChild(fx);

      return {
        fx: fx,
        swirl: swirl,
        fast: fast
      };
    }

    function makeParticles(canvas, count, colors, opts) {

      if (!canvas || !canvas.getContext) {
        return null;
      }

      var ctx = canvas.getContext('2d');
      var w = 0;
      var h = 0;
      var particles = [];
      var t = 0;
      var raf = null;
      var alive = false;

      function rand(a, b) {
        return a + Math.random() * (b - a);
      }

      function pick(arr) {
        return arr[
          Math.floor(Math.random() * arr.length)
        ];
      }

      function resize() {
        w = canvas.width = canvas.offsetWidth || canvas.clientWidth;
        h = canvas.height = canvas.offsetHeight || canvas.clientHeight;
      }

      function create() {
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: rand(opts.size[0], opts.size[1]),
          a: rand(
            opts.alpha ? opts.alpha[0] : 0.15,
            opts.alpha ? opts.alpha[1] : 0.8
          ),
          phase: Math.random() * Math.PI * 2,
          color: pick(colors),
          vx: opts.swirl
            ? rand(
                -(opts.drift || 0.5),
                (opts.drift || 0.5)
              )
            : rand(
                -opts.speed * 0.5,
                opts.speed * 0.5
              ),
          vy: opts.swirl
            ? rand(
                -(opts.drift || 0.5),
                (opts.drift || 0.5)
              )
            : rand(
                opts.speed * 0.4,
                opts.speed
              )
        };
      }

      function seed() {
        particles = [];
        for (var i = 0; i < count; i++) {
          particles.push(create());
        }
      }

      function setCount(newCount) {
        newCount = Math.max(0, Number(newCount) || 0);

        if (count === newCount) {
          return;
        }

        count = newCount;
        seed();
      }

      function setOptions(newOptions) {
        if (!newOptions) {
          return;
        }

        Object.keys(newOptions).forEach(
          function (key) {
            opts[key] = newOptions[key];
          }
        );

        seed();
      }

      function tick() {
        if (!alive) {
          return;
        }

        t += 0.016;
        ctx.clearRect(0, 0, w, h);

        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];

          if (opts.swirl) {
            var swirlAmp =
              typeof opts.swirlAmp === 'number'
                ? opts.swirlAmp
                : 0.7;

            p.x += Math.cos(t + p.phase) * swirlAmp + p.vx;
            p.y += Math.sin(t + p.phase) * swirlAmp + p.vy;
          } else {
            p.x += p.vx;
            p.y += p.vy;
          }

          if (p.y < -40) p.y = h + 40;
          if (p.y > h + 40) p.y = -40;
          if (p.x < -40) p.x = w + 40;
          if (p.x > w + 40) p.x = -40;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.a);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(tick);
      }

      resize();
      seed();

      return {
        start: function () {
          if (alive || reduce) {
            return;
          }
          alive = true;
          tick();
        },
        stop: function () {
          alive = false;
          if (raf) {
            cancelAnimationFrame(raf);
            raf = null;
          }
          if (ctx) {
            ctx.clearRect(0, 0, w, h);
          }
        },
        resize: function () {
          resize();
          seed();
        },
        setCount: function (newCount) {
          setCount(newCount);
        },
        setOptions: function (newOptions) {
          setOptions(newOptions);
        }
      };
    }

    var particleMedia =
      window.matchMedia
        ? window.matchMedia('(max-width: 720px)')
        : null;

    function isMobileParticleMode() {
      return particleMedia
        ? particleMedia.matches
        : window.innerWidth <= 720;
    }

    function syncParticleDensity() {
      var mobileParticles = isMobileParticleMode();

      if (swirlFx) {
        if (swirlFx.setCount) {
          swirlFx.setCount(
            mobileParticles ? 26 : 170
          );
        }

        if (swirlFx.setOptions) {
          swirlFx.setOptions(
            mobileParticles
              ? {
                  size: [1.15, 2.55],
                  alpha: [0.16, 0.46],
                  drift: 0.18,
                  swirlAmp: 0.34
                }
              : {
                  size: [1, 3],
                  alpha: [0.15, 0.8],
                  drift: 0.5,
                  swirlAmp: 0.7
                }
          );
        }
      }

      if (fastFx) {
        if (fastFx.setCount) {
          fastFx.setCount(
            mobileParticles ? 4 : 50
          );
        }

        if (fastFx.setOptions) {
          fastFx.setOptions(
            mobileParticles
              ? {
                  speed: 0.62,
                  size: [0.95, 1.65],
                  alpha: [0.14, 0.38]
                }
              : {
                  speed: 1.4,
                  size: [1, 2],
                  alpha: [0.15, 0.8]
                }
          );
        }
      }
    }

    var built = buildHeroFx();

    if (built) {
      var mobileParticles = isMobileParticleMode();

      /* Mobile uses subtle cinematic dust; desktop keeps the fuller field. */
      var swirlCount = mobileParticles ? 26 : 170;
      var fastCount = mobileParticles ? 4 : 50;

      swirlFx = makeParticles(
        built.swirl,
        swirlCount,
        ['#a57c52', '#f4c78a', '#3e2a1a'],
        mobileParticles
          ? {
              swirl: true,
              size: [1.15, 2.55],
              alpha: [0.16, 0.46],
              drift: 0.18,
              swirlAmp: 0.34
            }
          : {
              swirl: true,
              size: [1, 3],
              alpha: [0.15, 0.8],
              drift: 0.5,
              swirlAmp: 0.7
            }
      );

      fastFx = makeParticles(
        built.fast,
        fastCount,
        ['#a57c52'],
        mobileParticles
          ? {
              speed: 0.62,
              size: [0.95, 1.65],
              alpha: [0.14, 0.38]
            }
          : {
              speed: 1.4,
              size: [1, 2],
              alpha: [0.15, 0.8]
            }
      );
    }

    if (particleMedia) {
      if (particleMedia.addEventListener) {
        particleMedia.addEventListener(
          'change',
          syncParticleDensity
        );
      } else if (particleMedia.addListener) {
        particleMedia.addListener(
          syncParticleDensity
        );
      }
    }

    hero.classList.add('bm-new-ready');

    function finishNewHero() {

      clearTimeout(heroTimer);

      hero.classList.remove(
        'bm-new-ready',
        'bm-new-playing'
      );

      hero.classList.add(
        'bm-new-done'
      );

      if (swirlFx) {
        swirlFx.start();
      }

      if (fastFx) {
        fastFx.start();
      }

    }

    function playNewHero() {

      if (heroPlayed) {
        return;
      }

      heroPlayed = true;

      if (reduce) {
        finishNewHero();
        return;
      }

      hero.classList.remove(
        'bm-new-done'
      );

      hero.classList.add(
        'bm-new-ready'
      );

      void hero.offsetWidth;

      requestAnimationFrame(
        function () {

          requestAnimationFrame(
            function () {

              hero.classList.remove(
                'bm-new-ready'
              );

              hero.classList.add(
                'bm-new-playing'
              );

              if (swirlFx) {
                swirlFx.start();
              }

              if (fastFx) {
                fastFx.start();
              }

              heroTimer =
                window.setTimeout(
                  finishNewHero,
                  3200
                );

            }
          );

        }
      );

    }

    var heroImage =
      hero.querySelector(
        '.hero__art img'
      );

    if (
      heroImage &&
      !heroImage.complete
    ) {

      heroImage.addEventListener(
        'load',
        playNewHero,
        { once: true }
      );

      window.setTimeout(
        playNewHero,
        900
      );

    }

    else {

      playNewHero();

    }

    window.addEventListener(
      'resize',
      function () {
        if (swirlFx) {
          swirlFx.resize();
        }
        if (fastFx) {
          fastFx.resize();
        }

        /* Re-apply the correct density after viewport changes. */
        syncParticleDensity();
      }
    );

    document.addEventListener(
      'visibilitychange',
      function () {
        if (document.hidden) {
          if (swirlFx) {
            swirlFx.stop();
          }
          if (fastFx) {
            fastFx.stop();
          }
        } else if (hero.classList.contains('bm-new-playing') || hero.classList.contains('bm-new-done')) {
          if (swirlFx) {
            swirlFx.start();
          }
          if (fastFx) {
            fastFx.start();
          }
        }
      }
    );

    window.addEventListener(
      'beforeprint',
      function () {
        if (swirlFx) {
          swirlFx.stop();
        }
        if (fastFx) {
          fastFx.stop();
        }
        finishNewHero();
      }
    );

  }

  /* ==========================================================
     YOUR EXISTING JOIN-THE-TEAM PRINT CODE
  ========================================================== */

  var fold =
    document.querySelector(
      '.fold'
    );


  window.addEventListener(
    'beforeprint',

    function () {

      if (fold) {

        fold.dataset.was =
          fold.open
            ? '1'
            : '0';


        fold.open = true;

      }

    }
  );


  window.addEventListener(
    'afterprint',

    function () {

      if (
        fold &&
        fold.dataset.was === '0'
      ) {

        fold.open = false;

      }

    }
  );


  /* ==========================================================
     YOUR EXISTING IMAGE FALLBACK
  ========================================================== */

  document
    .querySelectorAll(
      '.shot img'
    )
    .forEach(

      function (img) {

        img.addEventListener(
          'error',

          function () {

            var shot =
              img.closest(
                '.shot'
              );


            if (shot) {

              shot.classList.add(
                'shot--empty'
              );


              img.remove();

            }

          }
        );

      }

    );


  /* ==========================================================
     YOUR EXISTING ICS CALENDAR CODE
  ========================================================== */

  var icsButton =
    document.getElementById(
      'ics'
    );


  if (icsButton) {

    icsButton.addEventListener(
      'click',

      function () {

        var ics = [

          'BEGIN:VCALENDAR',

          'VERSION:2.0',

          'PRODID:-//Being ME Canada//2026 Conference//EN',

          'BEGIN:VEVENT',

          'UID:beingme-2026-toronto@being-me.org',

          'DTSTAMP:20260101T000000Z',

          'DTSTART;TZID=America/Toronto:20261025T090000',

          'DTEND;TZID=America/Toronto:20261025T210000',

          'SUMMARY:Being ME 2026 Toronto Conference - A Life by His Design',

          'LOCATION:Toronto, ON',

          'DESCRIPTION:Registration and full details at https://attendbm.com/',

          'END:VEVENT',

          'END:VCALENDAR'

        ].join('\r\n');


        var url =
          URL.createObjectURL(

            new Blob(
              [ics],
              {
                type:
                  'text/calendar'
              }
            )

          );


        var anchor =
          document.createElement(
            'a'
          );


        anchor.href =
          url;


        anchor.download =
          'being-me-2026.ics';


        document.body.appendChild(
          anchor
        );


        anchor.click();


        anchor.remove();


        setTimeout(

          function () {

            URL.revokeObjectURL(
              url
            );

          },

          1000

        );

      }
    );

  }

});