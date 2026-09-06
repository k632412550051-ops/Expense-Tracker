import os
import re

files = ['public/about.html', 'public/privacy.html', 'public/terms.html']

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix the CSS rule
    # We change `.prose-content a { color: #2563eb; text-decoration: underline; }`
    # to target only a tags inside paragraphs or lists, so it leaves buttons alone.
    content = re.sub(
        r'\.prose-content a\s*{\s*color:\s*#2563eb;\s*text-decoration:\s*underline;\s*}',
        r'.prose-content p a, .prose-content li a, .prose-content div.highlight-box a { color: #2563eb; text-decoration: underline; }',
        content
    )
    content = re.sub(
        r'\.prose-content a\s*{\s*color:\s*#38bdf8;\s*}',
        r'.prose-content p a, .prose-content li a, .prose-content div.highlight-box a { color: #38bdf8; }',
        content
    )

    # 2. Fix the CTA button in about.html (though it might be fixed by the CSS change, we'll make it explicit)
    if 'about.html' in filepath:
        content = content.replace(
            'class="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"',
            'class="!text-white !no-underline inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"'
        )

    # 3. Fix the footer buttons in privacy.html and terms.html
    bad_footer_pattern = re.compile(
        r'<div style="display: flex; gap: 12px; margin-top: 32px;">(.*?)</div>',
        re.DOTALL
    )
    
    good_footer = """<div class="flex flex-wrap gap-3 mt-10 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
      <a href="./" class="!no-underline inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md shadow-blue-500/20 text-sm">
        &larr; Quay lại Ứng dụng
      </a>
      <a href="about.html" class="!no-underline inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 font-semibold transition-all text-sm border border-blue-200 dark:border-blue-800/50">
        Trang giới thiệu
      </a>
      <a href="terms.html" class="!no-underline inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all text-sm border border-slate-200 dark:border-slate-700">
        Điều khoản dịch vụ
      </a>
      <a href="privacy.html" class="!no-underline inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all text-sm border border-slate-200 dark:border-slate-700">
        Quyền riêng tư
      </a>
    </div>"""

    content = bad_footer_pattern.sub(good_footer, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Buttons fixed.")
