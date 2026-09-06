import re
import os

files = ['public/about.html', 'public/privacy.html', 'public/terms.html']

head_template = """
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>__TITLE__</title>
  <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'media',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            heading: ['"Plus Jakarta Sans"', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #f8fafc;
      background-image: 
        radial-gradient(at 0% 0%, hsla(217,100%,76%,0.15) 0px, transparent 50%),
        radial-gradient(at 100% 0%, hsla(189,100%,56%,0.15) 0px, transparent 50%);
      background-attachment: fixed;
    }
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #090e1a;
        background-image: 
          radial-gradient(at 0% 0%, hsla(217,100%,76%,0.08) 0px, transparent 50%),
          radial-gradient(at 100% 0%, hsla(189,100%,56%,0.08) 0px, transparent 50%);
      }
    }
    
    .liquid-glass-elevated {
      background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(24px) saturate(200%);
      -webkit-backdrop-filter: blur(24px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 20px 40px -8px rgba(14, 76, 165, 0.12),
                  0 4px 12px -2px rgba(14, 76, 165, 0.06),
                  inset 0 1px 1px 0 rgba(255, 255, 255, 1);
    }
    @media (prefers-color-scheme: dark) {
      .liquid-glass-elevated {
        background: rgba(22, 32, 54, 0.85);
        backdrop-filter: blur(28px) saturate(200%);
        -webkit-backdrop-filter: blur(28px) saturate(200%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 24px 48px -8px rgba(0, 0, 0, 0.75),
                    inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.28);
      }
    }
    .prose-content h1 { font-size: 2rem; font-weight: 800; color: #2563eb; margin-bottom: 1rem; }
    .prose-content h2 { font-size: 1.25rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(148, 163, 184, 0.2); padding-bottom: 0.5rem; }
    .prose-content h3 { font-size: 1.1rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; }
    .prose-content p, .prose-content li { margin-bottom: 0.75rem; line-height: 1.6; color: #334155; }
    @media (prefers-color-scheme: dark) {
      .prose-content h1 { color: #38bdf8; }
      .prose-content h2 { color: #f8fafc; }
      .prose-content h3 { color: #f8fafc; }
      .prose-content p, .prose-content li { color: #cbd5e1; }
    }
    .prose-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
    .prose-content a { color: #2563eb; text-decoration: underline; }
    @media (prefers-color-scheme: dark) {
      .prose-content a { color: #38bdf8; }
    }
    .prose-content .meta { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
  </style>
</head>
"""

header_html = """
<body class="text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col">
  <header class="sticky top-0 z-30 border-b border-white/80 dark:border-white/15 shadow-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <a href="./index.html" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 p-0.5 shadow-md flex items-center justify-center">
          <div class="w-full h-full rounded-[14px] bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
        </div>
        <span class="font-bold text-lg font-heading tracking-tight text-slate-900 dark:text-white">Expense Tracker</span>
      </a>
      <a href="./index.html" class="text-sm font-semibold text-blue-600 dark:text-cyan-400 hover:underline">Quay lại ứng dụng</a>
    </div>
  </header>
  
  <main class="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
    <div class="liquid-glass-elevated rounded-3xl p-8 sm:p-12 relative overflow-hidden prose-content">
"""

footer_html = """
    </div>
  </main>
  
  <footer class="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
    <p>&copy; 2026 Expense Tracker. All rights reserved.</p>
  </footer>
</body>
</html>
"""

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    title_match = re.search(r'<title>(.*?)</title>', content)
    title = title_match.group(1) if title_match else "Expense Tracker"
    
    body_match = re.search(r'<div class="container">(.*?)</div>\s*</body>', content, re.DOTALL)
    if body_match:
        inner_content = body_match.group(1)
    else:
        body_match = re.search(r'<body[^>]*>(.*?)</body>', content, re.DOTALL)
        inner_content = body_match.group(1) if body_match else ""
        
        inner_content = re.sub(r'<header.*?</header>', '', inner_content, flags=re.DOTALL)
        inner_content = re.sub(r'<div class="header">.*?</div>', '', inner_content, flags=re.DOTALL)

    head_filled = head_template.replace("__TITLE__", title)
    new_content = f"<!DOCTYPE html>\n<html lang=\"vi\">\n" + head_filled + header_html + inner_content + footer_html
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

print("Updated HTML files.")
