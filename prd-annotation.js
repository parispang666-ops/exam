(function () {
  'use strict';

  /* ---- 读取 JSON 配置 ---- */
  var configEl = document.getElementById('prd-annotation-config');
  if (!configEl) return;
  var config;
  try { config = JSON.parse(configEl.textContent); } catch (e) { console.error('prd-annotation:', e); return; }

  var badges    = config.badges || [];
  var pagePrd   = config.pagePrd || '';
  var globalPrd = config.globalPrd || '';
  var scope     = config.scope || (globalPrd ? 'with_global' : 'page_only');

  /* ---- 浮窗：全局唯一 ---- */
  var popover       = document.createElement('div');
  popover.className = 'prd-annotation-popover';
  popover.innerHTML =
    '<div class="popover-header">' +
      '<span class="popover-title"></span>' +
      '<button class="popover-close" title="关闭">&times;</button>' +
    '</div>' +
    '<div class="popover-body"></div>';
  document.body.appendChild(popover);

  var popoverTitleEl = popover.querySelector('.popover-title');
  var popoverBodyEl  = popover.querySelector('.popover-body');
  var popoverClose   = popover.querySelector('.popover-close');

  var activeBadgeEl  = null;
  var activeBadgeId  = null;

  function closePopover() {
    popover.classList.remove('open');
    activeBadgeEl = null;
    activeBadgeId = null;
  }

  popoverClose.addEventListener('click', function (e) {
    e.stopPropagation();
    closePopover();
  });

  /* ---- PRD 抽屉 ---- */
  var drawerBackdrop       = document.createElement('div');
  drawerBackdrop.className = 'prd-drawer-backdrop';
  document.body.appendChild(drawerBackdrop);

  var drawer       = document.createElement('div');
  drawer.className = 'prd-drawer';
  drawer.innerHTML =
    '<div class="drawer-header">' +
      '<span class="drawer-title"></span>' +
      '<button class="drawer-close" title="关闭">&times;</button>' +
    '</div>' +
    '<div class="drawer-body"></div>';
  document.body.appendChild(drawer);

  var drawerTitleEl = drawer.querySelector('.drawer-title');
  var drawerBodyEl  = drawer.querySelector('.drawer-body');
  var drawerClose   = drawer.querySelector('.drawer-close');

  function closeDrawer() {
    drawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
  }

  drawerClose.addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);

  function openDrawer(title, mdContent) {
    drawerTitleEl.textContent = title;
    try {
      drawerBodyEl.innerHTML = mdToHtml(mdContent);
      // 渲染 mermaid 流程图
      setTimeout(function () {
        if (typeof mermaid !== 'undefined') {
          try { mermaid.run({ querySelector: '.drawer-body .mermaid' }); } catch (e) {}
        }
      }, 100);
    } catch (e) {
      console.error('prd-annotation: mdToHtml error', e);
      drawerBodyEl.innerHTML = '<pre>' + (mdContent || '') + '</pre>';
    }
    drawer.classList.add('open');
    drawerBackdrop.classList.add('open');
  }

  var showPrdActions = config.showPrdActions !== false;

  /* ---- 右上角 PRD 抽屉按钮 ---- */
  if (showPrdActions) {
    var btnWrap = document.createElement('div');
    btnWrap.className = 'prd-drawer-btn-wrap';

    var pagePrdBtn = document.createElement('button');
    pagePrdBtn.className = 'prd-drawer-btn';
    pagePrdBtn.textContent = '\u{1F4C4} \u9875\u9762PRD';
    pagePrdBtn.addEventListener('click', function () {
      openDrawer('\u9875\u9762PRD - ' + (config.pageTitle || ''), pagePrd);
    });
    btnWrap.appendChild(pagePrdBtn);

    if (scope === 'with_global' && globalPrd) {
      var globalPrdBtn = document.createElement('button');
      globalPrdBtn.className = 'prd-drawer-btn';
      globalPrdBtn.textContent = '\u{1F4C4} \u6574\u4F53PRD';
      globalPrdBtn.addEventListener('click', function () {
        openDrawer('\u6574\u4F53PRD - \u8003\u8BD5\u529F\u80FD', globalPrd);
      });
      btnWrap.appendChild(globalPrdBtn);
    }

    document.body.appendChild(btnWrap);
  }

  /* ---- 右下角全局标注开关 ---- */
  var toggleBtn       = document.createElement('button');
  toggleBtn.className = 'prd-toggle-btn';
  toggleBtn.title     = '\u5207\u6362\u6807\u6CE8\u663E\u793A';
  toggleBtn.textContent = '\u{1F441}';
  var badgesVisible = true;

  toggleBtn.addEventListener('click', function () {
    badgesVisible = !badgesVisible;
    var allBadges = document.querySelectorAll('.prd-badge');
    for (var i = 0; i < allBadges.length; i++) {
      allBadges[i].style.display = badgesVisible ? '' : 'none';
    }
    if (!badgesVisible) {
      toggleBtn.classList.add('off');
      closePopover();
    } else {
      toggleBtn.classList.remove('off');
    }
  });
  document.body.appendChild(toggleBtn);

  /* ---- ESC 关闭浮窗/抽屉 ---- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (drawer.classList.contains('open')) { closeDrawer(); return; }
      if (activeBadgeId !== null) { closePopover(); }
    }
  });

  /* ---- 浮窗外点击关闭 ---- */
  document.addEventListener('click', function (e) {
    if (activeBadgeId === null) return;
    var target = e.target;
    // 点击角标自身 / 浮窗内部 → 不关
    if (target.closest('.prd-badge') || target.closest('.prd-annotation-popover')) return;
    closePopover();
  });

  /* ---- 浮窗智能定位 ---- */
  function positionPopover(badgeEl) {
    var rect = badgeEl.getBoundingClientRect();
    var pw   = popover.offsetWidth  || 450;
    var ph   = popover.offsetHeight || 300;
    var vw   = window.innerWidth;
    var vh   = window.innerHeight;
    var gap  = 8;

    var left, top;

    // 优先尝试右侧
    if (rect.right + gap + pw <= vw - gap) {
      left = rect.right + gap;
      top  = rect.top - (ph - rect.height) / 2;
    }
    // 其次尝试左侧
    else if (rect.left - gap - pw >= gap) {
      left = rect.left - gap - pw;
      top  = rect.top - (ph - rect.height) / 2;
    }
    // 最后放在下方
    else {
      left = Math.max(gap, Math.min(rect.left, vw - pw - gap));
      top  = rect.bottom + gap;
    }

    // 垂直方向不超出视口
    if (top < gap) top = gap;
    if (top + ph > vh - gap) top = vh - ph - gap;

    popover.style.left = left + 'px';
    popover.style.top  = top  + 'px';
  }

  /* ---- 打开浮窗 ---- */
  function openPopover(badge, badgeEl) {
    // 浮窗可能被外部代码（如弹窗）移除，确保重新附加到 DOM
    if (!popover.parentNode) {
      document.body.appendChild(popover);
    }

    // 关闭上一个
    if (activeBadgeEl && activeBadgeEl !== badgeEl) closePopover();

    if (activeBadgeId === badge.id) {
      closePopover();
      return;
    }

    activeBadgeEl  = badgeEl;
    activeBadgeId  = badge.id;
    popoverTitleEl.textContent = badge.id + ' ' + badge.title;
    popoverBodyEl.innerHTML    = badge.content;

    // 先显示才能正确测量宽高
    popover.classList.add('open');

    // 定位
    positionPopover(badgeEl);
  }

  /* ---- 渲染角标 ---- */
  badges.forEach(function (badge) {
    var anchor = document.querySelector(badge.anchor.selector);
    if (!anchor) {
      console.warn('prd-annotation: \u672A\u627E\u5230\u951A\u70B9 ' + badge.anchor.selector);
      return;
    }

    // 确保锚点元素是定位上下文（position: relative），使角标能正确定位
    anchor.classList.add('prd-anchor');

    var badgeEl = document.createElement('span');
    badgeEl.className = 'prd-badge';
    badgeEl.setAttribute('data-badge-id', badge.id);
    badgeEl.textContent = badge.id;

    badgeEl.addEventListener('click', function (e) {
      e.stopPropagation();
      openPopover(badge, badgeEl);
    });

    anchor.appendChild(badgeEl);
  });

  /* ---- 简易 Markdown → HTML ---- */
  function mdToHtml(md) {
    if (!md) return '';
    var lines = md.split('\n');
    var out = [];
    var i = 0;

    function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function renderInline(text) {
      return escapeHtml(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    function renderTable(tableLines) {
      var rows = tableLines.map(function (l) {
        return l.replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
      });
      if (rows.length === 0) return '';
      var html = '<table>';
      var hasSep = rows.length >= 2 && /^[-: ]+$/.test(rows[1][0]);
      var startIdx = 0;
      if (rows.length > 0) {
        html += '<thead><tr>';
        rows[0].forEach(function (c) { html += '<th>' + renderInline(c) + '</th>'; });
        html += '</tr></thead>';
        startIdx = hasSep ? 2 : 1;
      }
      if (startIdx < rows.length) {
        html += '<tbody>';
        for (var r = startIdx; r < rows.length; r++) {
          html += '<tr>';
          rows[r].forEach(function (c) { html += '<td>' + renderInline(c) + '</td>'; });
          html += '</tr>';
        }
        html += '</tbody>';
      }
      html += '</table>';
      return html;
    }

    var safety = 0, maxIter = lines.length * 10;
    while (i < lines.length) {
      if (++safety > maxIter) { console.error('prd-annotation: mdToHtml infinite loop'); break; }
      var line = lines[i];

      // 代码块 ```
      if (/^```/.test(line)) {
        var lang = line.slice(3).trim();
        var codeLines = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) {
          codeLines.push(lines[i]);
          i++;
        }
        var codeContent = codeLines.join('\n');
        if (lang === 'mermaid') {
          out.push('<div class="mermaid">' + codeContent + '</div>');
        } else {
          var langAttr = lang ? ' class="language-' + escapeHtml(lang) + '"' : '';
          out.push('<pre><code' + langAttr + '>' + escapeHtml(codeContent) + '</code></pre>');
        }
        i++;
        continue;
      }

      // 空行
      if (/^\s*$/.test(line)) {
        i++;
        continue;
      }

      // 表格 | ... |
      if (/^\|.*\|/.test(line)) {
        var tableLines = [];
        while (i < lines.length && /^\|.*\|/.test(lines[i])) {
          tableLines.push(lines[i]);
          i++;
        }
        out.push(renderTable(tableLines));
        continue;
      }

      // 标题 # ## ### ####
      var hMatch = line.match(/^(#{1,4})\s+(.+)/);
      if (hMatch) {
        var level = hMatch[1].length;
        var title = hMatch[2];
        out.push('<h' + level + '>' + renderInline(title) + '</h' + level + '>');
        i++;
        continue;
      }

      // 水平线 --- / ***
      if (/^[-*]{3,}\s*$/.test(line)) {
        out.push('<hr>');
        i++;
        continue;
      }

      // 引用 >
      if (/^>\s?/.test(line)) {
        var quoteLines = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        out.push('<blockquote><p>' + renderInline(quoteLines.join('<br>')) + '</p></blockquote>');
        continue;
      }

      // 有序列表 1. 2.
      if (/^\d+\.\s/.test(line)) {
        out.push('<ol>');
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
          out.push('<li>' + renderInline(lines[i].replace(/^\d+\.\s/, '')) + '</li>');
          i++;
        }
        out.push('</ol>');
        continue;
      }

      // 无序列表 - *
      if (/^[-*]\s/.test(line)) {
        out.push('<ul>');
        while (i < lines.length && /^[-*]\s/.test(lines[i])) {
          out.push('<li>' + renderInline(lines[i].replace(/^[-*]\s/, '')) + '</li>');
          i++;
        }
        out.push('</ul>');
        continue;
      }

      // 普通段落
      var paraLines = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,4}\s|```|\||>\s?|\d+\.\s)/.test(lines[i])) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        out.push('<p>' + renderInline(paraLines.join('<br>')) + '</p>');
      } else {
        // 无法识别的行，跳过防止死循环
        i++;
      }
    }

    return out.join('\n');
  }

  console.log('prd-annotation: \u5DF2\u6E32\u67D3 ' + badges.length + ' \u4E2A\u89D2\u6807\uff0C\u5269\u4F59\u529F\u80FD\u5DF2\u5C31\u4F4D');
})();
