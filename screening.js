/**
 * EnnHealth Psychiatry — Self-Screening Widget
 * Embeds validated mental health screening tools on condition pages.
 *
 * Usage: Add <div id="screening"></div> then call initScreening({...})
 *
 * IMPORTANT: These are screening tools, NOT diagnostic instruments.
 * All results include disclaimers and CTAs to schedule with a provider.
 */
(function() {
  'use strict';

  window.initScreening = function(config) {
    var el = document.getElementById(config.containerId || 'screening');
    if (!el) return;

    // Inject responsive styles once
    if (!document.getElementById('screening-styles')) {
      var style = document.createElement('style');
      style.id = 'screening-styles';
      style.textContent =
        '@media(max-width:600px){' +
          '.scr-wrap{margin:24px -4px !important;}' +
          '.scr-hdr,.scr-disc,.scr-body,.scr-instr{padding-left:16px !important;padding-right:16px !important;}' +
          '.scr-q{padding:14px 14px !important;}' +
          '.scr-opts{gap:6px !important;}' +
          '.scr-opt{padding:10px 16px !important;font-size:13px !important;min-height:44px !important;}' +
          '.scr-res-inner{padding:24px 16px !important;}' +
          '.scr-res-cta{padding:20px 16px !important;}' +
        '}' +
        /* Mobile floating CTA — hidden on desktop */
        '.scr-fab{display:none;}' +
        '@media(max-width:768px){' +
          '.scr-fab{display:flex; position:fixed; bottom:20px; left:50%; transform:translateX(-50%); z-index:999;' +
            'align-items:center; gap:8px; background:#D4A855; color:#1a3545; padding:14px 24px;' +
            'border-radius:100px; border:none; box-shadow:0 4px 20px rgba(0,0,0,0.2); font-family:inherit;' +
            'font-size:15px; font-weight:700; cursor:pointer; text-decoration:none; white-space:nowrap; touch-action:manipulation; -webkit-tap-highlight-color:transparent;' +
            'transition:opacity 0.3s, transform 0.3s;}' +
          '.scr-fab.hidden{opacity:0; pointer-events:none; transform:translateX(-50%) translateY(20px);}' +
        '}';
      document.head.appendChild(style);
    }

    var answered = {};
    var showingResults = false;

    function render() {
      if (showingResults) { renderResults(); return; }
      renderQuiz();
    }

    function renderQuiz() {
      var html = '<div class="scr-wrap" style="background:white; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; margin:40px 0;">';

      // Header
      html += '<div class="scr-hdr" style="background:linear-gradient(135deg, #f0f9ff 0%, #ecfeff 100%); border-bottom:1px solid #bae6fd; padding:28px 32px; text-align:center;">';
      html += '<div style="font-size:28px; margin-bottom:8px;">&#128203;</div>';
      html += '<h3 style="font-family:Playfair Display,Georgia,serif; font-size:1.3rem; color:#2C4A5A; margin:0 0 8px;">' + config.title + '</h3>';
      html += '<p style="color:#64748b; font-size:14px; line-height:1.6; margin:0;">' + config.description + '</p>';
      html += '</div>';

      // Disclaimer banner
      html += '<div class="scr-disc" style="background:#fefce8; border-bottom:1px solid #fde68a; padding:12px 32px; text-align:center;">';
      html += '<p style="font-size:12px; color:#92400e; margin:0; line-height:1.5;"><strong>Disclaimer:</strong> This screening is for educational purposes only and is <strong>not a diagnosis</strong>. Only a licensed clinician can provide a formal diagnosis. Results should be discussed with a qualified mental health provider.</p>';
      html += '</div>';

      // Instruction
      if (config.instruction) {
        html += '<div class="scr-instr" style="padding:20px 32px 0;">';
        html += '<p style="font-size:15px; color:#374151; font-weight:600; margin:0;">' + config.instruction + '</p>';
        html += '</div>';
      }

      // Questions
      html += '<div class="scr-body" style="padding:16px 32px 24px;">';
      for (var i = 0; i < config.questions.length; i++) {
        var q = config.questions[i];
        var isAnswered = answered[i] !== undefined;

        html += '<div class="scr-q" style="border:1px solid ' + (isAnswered ? '#bbf7d0' : '#e2e8f0') + '; border-radius:12px; padding:18px 20px; margin-bottom:12px; background:' + (isAnswered ? '#f0fdf4' : '#fafafa') + '; transition:all 0.2s;">';
        html += '<p style="font-size:14px; font-weight:600; color:#1e293b; margin:0 0 12px;"><span style="color:#2C4A5A; font-weight:700;">' + (i + 1) + '.</span> ' + q.text + '</p>';
        html += '<div class="scr-opts" style="display:flex; flex-wrap:wrap; gap:8px;">';

        var opts = q.options || config.defaultOptions;
        for (var j = 0; j < opts.length; j++) {
          var selected = answered[i] === j;
          var label = typeof opts[j] === 'object' ? opts[j].label : opts[j];
          html += '<button class="scr-opt" onclick="window._screenSelect(' + i + ',' + j + ')" style="';
          html += 'padding:8px 16px; border-radius:100px; font-size:13px; font-family:inherit; cursor:pointer; transition:all 0.15s; touch-action:manipulation; -webkit-tap-highlight-color:transparent; ';
          if (selected) {
            html += 'background:#2C4A5A; color:white; border:1.5px solid #2C4A5A; font-weight:600;';
          } else {
            html += 'background:white; color:#374151; border:1.5px solid #d1d5db; font-weight:500;';
          }
          html += '">' + label + '</button>';
        }

        html += '</div></div>';
      }

      // Submit button
      var totalQ = config.questions.length;
      var answeredCount = Object.keys(answered).length;
      var allDone = answeredCount === totalQ;

      html += '<div style="text-align:center; margin-top:20px;">';
      html += '<p style="font-size:13px; color:#94a3b8; margin-bottom:12px;">' + answeredCount + ' of ' + totalQ + ' questions answered</p>';
      html += '<button onclick="window._screenSubmit()" ' + (allDone ? '' : 'disabled') + ' style="';
      html += 'padding:14px 32px; border-radius:10px; font-size:16px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.2s; border:none; touch-action:manipulation; -webkit-tap-highlight-color:transparent; ';
      if (allDone) {
        html += 'background:#D4A855; color:#1a3545;';
      } else {
        html += 'background:#e2e8f0; color:#94a3b8; cursor:not-allowed;';
      }
      html += '">See My Results</button>';
      html += '</div></div></div>';

      el.innerHTML = html;
    }

    function renderResults() {
      var score = 0;
      for (var i = 0; i < config.questions.length; i++) {
        var q = config.questions[i];
        var opts = q.options || config.defaultOptions;
        var val = answered[i] || 0;
        if (typeof opts[val] === 'object' && opts[val].value !== undefined) {
          score += opts[val].value;
        } else {
          score += val;
        }
      }

      var maxScore = 0;
      for (var k = 0; k < config.questions.length; k++) {
        var qOpts = config.questions[k].options || config.defaultOptions;
        var maxVal = 0;
        for (var m = 0; m < qOpts.length; m++) {
          var v = typeof qOpts[m] === 'object' ? (qOpts[m].value || 0) : m;
          if (v > maxVal) maxVal = v;
        }
        maxScore += maxVal;
      }

      // Find matching level
      var result = config.scoring[0];
      for (var s = 0; s < config.scoring.length; s++) {
        if (score >= config.scoring[s].min && score <= config.scoring[s].max) {
          result = config.scoring[s];
          break;
        }
      }

      var pct = Math.round((score / maxScore) * 100);
      var barColor = result.color || '#D4A855';

      var html = '<div style="background:white; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; margin:40px 0;">';

      // Header
      html += '<div style="background:linear-gradient(135deg, #2C4A5A 0%, #1a3545 100%); padding:32px; text-align:center;">';
      html += '<h3 style="font-family:Playfair Display,Georgia,serif; font-size:1.5rem; color:white; margin:0 0 8px;">Your Screening Results</h3>';
      html += '<p style="color:#b0c4ce; font-size:14px; margin:0;">' + config.title + '</p>';
      html += '</div>';

      // Score display
      html += '<div class="scr-res-inner" style="padding:32px; text-align:center;">';

      // Score circle
      html += '<div style="width:100px; height:100px; border-radius:50%; border:4px solid ' + barColor + '; display:inline-flex; align-items:center; justify-content:center; flex-direction:column; margin-bottom:16px;">';
      html += '<span style="font-family:Playfair Display,Georgia,serif; font-size:2rem; font-weight:700; color:#1e293b; line-height:1;">' + score + '</span>';
      html += '<span style="font-size:11px; color:#94a3b8;">of ' + maxScore + '</span>';
      html += '</div>';

      // Score bar
      html += '<div style="max-width:400px; margin:0 auto 20px;">';
      html += '<div style="background:#e2e8f0; border-radius:100px; height:8px; overflow:hidden;">';
      html += '<div style="background:' + barColor + '; height:100%; width:' + pct + '%; border-radius:100px; transition:width 0.5s;"></div>';
      html += '</div></div>';

      // Level
      html += '<div style="display:inline-block; background:' + (result.bg || '#f8fafb') + '; border:1px solid ' + barColor + '; border-radius:100px; padding:6px 20px; margin-bottom:16px;">';
      html += '<span style="font-size:14px; font-weight:700; color:' + barColor + ';">' + result.level + '</span>';
      html += '</div>';

      // Description
      html += '<p style="color:#374151; font-size:15px; line-height:1.7; max-width:500px; margin:0 auto 24px;">' + result.description + '</p>';

      // Disclaimer box
      html += '<div style="background:#fefce8; border:1px solid #fde68a; border-radius:12px; padding:16px 20px; max-width:500px; margin:0 auto 24px; text-align:left;">';
      html += '<p style="font-size:13px; color:#92400e; margin:0; line-height:1.6;"><strong>Remember:</strong> This result is <strong>not a medical diagnosis</strong>. It is a screening tool designed to help you understand your symptoms. Many factors — including other medical conditions, medications, and life circumstances — can influence your responses. A licensed clinician can provide a thorough evaluation and accurate diagnosis.</p>';
      html += '</div>';

      // CTA
      html += '<div class="scr-res-cta" style="background:linear-gradient(135deg, #2C4A5A 0%, #1a3545 100%); border-radius:12px; padding:28px; max-width:500px; margin:0 auto;">';
      html += '<h4 style="font-family:Playfair Display,Georgia,serif; color:white; font-size:1.15rem; margin:0 0 8px;">Want to Discuss These Results?</h4>';
      html += '<p style="color:#b0c4ce; font-size:14px; margin:0 0 16px;">Schedule a confidential evaluation with one of our board-certified psychiatric providers to discuss your screening results and explore treatment options.</p>';
      html += '<a href="/#book" style="display:inline-flex; align-items:center; gap:8px; background:#D4A855; color:#1a3545; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">Schedule Your Evaluation &rarr;</a>';
      html += '</div>';

      // Retake
      html += '<button onclick="window._screenRetake()" style="margin-top:16px; padding:10px 20px; border:1.5px solid #d1d5db; border-radius:100px; background:white; color:#64748b; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; touch-action:manipulation; -webkit-tap-highlight-color:transparent; min-height:44px;">Retake Screening</button>';

      html += '</div></div>';

      el.innerHTML = html;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    window._screenSelect = function(qi, oi) {
      answered[qi] = oi;
      render();
    };

    window._screenSubmit = function() {
      showingResults = true;
      render();
    };

    window._screenRetake = function() {
      answered = {};
      showingResults = false;
      render();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    render();

    // Mobile floating CTA button — scrolls to screening, hides when in view
    if (!document.getElementById('scr-fab')) {
      var fab = document.createElement('button');
      fab.id = 'scr-fab';
      fab.className = 'scr-fab';
      fab.innerHTML = '&#128203; Take Free Screening';
      fab.onclick = function() {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      document.body.appendChild(fab);

      // Hide FAB when screening section is visible or when showing results
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
          fab.classList.toggle('hidden', entries[0].isIntersecting);
        }, { threshold: 0.15 });
        observer.observe(el);
      }

      // Also hide FAB once user starts answering (they found it)
      var origSelect = window._screenSelect;
      window._screenSelect = function(qi, oi) {
        fab.classList.add('hidden');
        origSelect(qi, oi);
      };
    }
  };
})();
