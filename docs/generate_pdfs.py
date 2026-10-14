"""
Centralized College LMS 2.0 - Publication Quality PDF Generator
Converts Markdown Documentation & Guides into beautifully styled PDFs
with rendered Mermaid Vector Diagrams, Math formulas, Tables, and Header/Footer.
"""

import os
import sys
import json
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

DOCS_DIR = Path(__file__).resolve().parent

HTML_SHELL = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>__PAGE_TITLE__</title>
  <!-- GitHub Markdown CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown.min.css">
  <!-- KaTeX CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  
  <!-- Marked, KaTeX, and Mermaid JS -->
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>

  <style>
    @page {
      size: A4;
      margin: 22mm 16mm 22mm 16mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      background-color: #ffffff;
      color: #1e293b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 13px;
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }

    .markdown-body {
      color: #1e293b;
      background: transparent;
      font-size: 13px;
      line-height: 1.65;
      max-width: 100%;
    }

    /* Modern document header banner */
    .doc-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%);
      color: #ffffff;
      padding: 28px 24px;
      border-radius: 10px;
      margin-bottom: 28px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .doc-banner h1 {
      color: #ffffff !important;
      border: none !important;
      margin: 0 0 8px 0 !important;
      padding: 0 !important;
      font-size: 26px !important;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .doc-banner .subtitle {
      color: #93c5fd;
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .doc-banner .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .doc-banner .badge {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #f8fafc;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      backdrop-filter: blur(4px);
    }

    /* Headings hierarchy */
    .markdown-body h1 {
      color: #0f172a;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-top: 32px;
      margin-bottom: 14px;
      font-size: 22px;
      font-weight: 700;
      page-break-after: avoid;
      break-after: avoid;
    }

    .markdown-body h2 {
      color: #1e3a8a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 28px;
      margin-bottom: 12px;
      font-size: 17px;
      font-weight: 700;
      page-break-after: avoid;
      break-after: avoid;
    }

    .markdown-body h3 {
      color: #0f172a;
      margin-top: 22px;
      margin-bottom: 8px;
      font-size: 14.5px;
      font-weight: 600;
      page-break-after: avoid;
      break-after: avoid;
    }

    .markdown-body h4, .markdown-body h5, .markdown-body h6 {
      color: #334155;
      margin-top: 16px;
      margin-bottom: 6px;
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Avoid breaks inside critical components */
    .markdown-body table,
    .markdown-body pre,
    .markdown-body blockquote,
    .mermaid-card {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Dedicated page breaks before complex diagrams for clean presentation */
    .break-before {
      page-break-before: always;
      break-before: always;
    }

    /* Tables styling */
    .markdown-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 11.5px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    .markdown-body table th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
      padding: 9px 10px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }

    .markdown-body table td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
      color: #334155;
    }

    .markdown-body table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Code styling */
    .markdown-body code {
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 11.5px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }

    .markdown-body pre code {
      background-color: transparent;
      padding: 0;
      color: inherit;
    }

    .markdown-body pre {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      font-size: 11.5px;
      line-height: 1.45;
      overflow-x: auto;
      color: #0f172a;
    }

    /* Mermaid vector card */
    .mermaid-card {
      display: block;
      width: 100%;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 10px;
      margin: 16px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      text-align: center;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .mermaid-card .caption {
      font-size: 10.5px;
      font-weight: 600;
      color: #64748b;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-top: 1px dashed #e2e8f0;
      padding-top: 6px;
    }

    .mermaid {
      width: 100%;
      text-align: center;
      display: block;
    }

    .mermaid svg {
      max-width: 100% !important;
      max-height: 720px !important;
      width: auto !important;
      height: auto !important;
      display: block;
      margin: 0 auto;
    }

    /* KaTeX formula display */
    .katex-display {
      margin: 16px 0;
      padding: 10px 0;
      overflow-x: auto;
      overflow-y: hidden;
      font-size: 15px;
    }

    /* Blockquotes */
    .markdown-body blockquote {
      border-left: 4px solid #2563eb;
      color: #334155;
      background-color: #eff6ff;
      padding: 10px 16px;
      border-radius: 0 6px 6px 0;
      margin: 14px 0;
    }

    /* Horizontal rules */
    .markdown-body hr {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 24px 0;
    }

    /* Lists */
    .markdown-body ul, .markdown-body ol {
      padding-left: 22px;
      margin: 8px 0;
    }

    .markdown-body li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  __BANNER_HTML__
  <div class="markdown-body" id="doc-content"></div>

  <script>
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        showSequenceNumbers: true,
        actorFontSize: 13,
        actorFontWeight: 600,
        noteFontSize: 12,
        messageFontSize: 12,
        messageMargin: 20,
        boxMargin: 6,
        noteMargin: 6,
        mirrorActors: false,
        wrap: true,
        width: 140
      },
      er: {
        useMaxWidth: true,
        fontSize: 13
      },
      themeVariables: {
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        primaryColor: '#eff6ff',
        primaryBorderColor: '#3b82f6',
        primaryTextColor: '#0f172a',
        lineColor: '#334155',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#f1f5f9'
      }
    });

    async function renderDoc(markdownRaw) {
      // 1. Extract mermaid blocks and replace with placeholders
      const mermaidBlocks = [];
      let counter = 0;
      
      const processedMarkdown = markdownRaw.replace(/```mermaid\\s*\\n([\\s\\S]*?)```/g, (match, code) => {
        const id = 'mermaid-block-' + (counter++);
        mermaidBlocks.push({ id, code: code.trim() });
        return `<div class="mermaid-card"><div class="mermaid" id="${id}"></div><div class="caption">System Architecture & Workflow Diagram</div></div>`;
      });

      // 2. Parse markdown with marked
      marked.use({
        gfm: true,
        breaks: false
      });
      document.getElementById('doc-content').innerHTML = marked.parse(processedMarkdown);

      // 3. Render KaTeX math
      if (window.renderMathInElement) {
        renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      }

      // 4. Render Mermaid diagrams
      for (const block of mermaidBlocks) {
        try {
          const { svg } = await mermaid.render('svg_' + block.id, block.code);
          const el = document.getElementById(block.id);
          if (el) {
            el.innerHTML = svg;
          }
        } catch (err) {
          console.error('Mermaid render error in ' + block.id, err);
          const el = document.getElementById(block.id);
          if (el) {
            el.innerHTML = '<pre style="color:red; text-align:left;">Diagram Error: ' + err.message + '</pre>';
          }
        }
      }

      return { success: true, count: mermaidBlocks.length };
    }
  </script>
</body>
</html>
"""

DOCS = [
    {
        "input_md": "PROJECT_DOCUMENTATION_AND_PPT_GUIDE.md",
        "output_pdf": "PROJECT_DOCUMENTATION_AND_PPT_GUIDE.pdf",
        "title": "Centralized College LMS 2.0 - Complete Documentation & Presentation Kit",
        "banner": """
        <div class="doc-banner">
          <h1>Centralized College LMS 2.0</h1>
          <div class="subtitle">Complete Technical Specification, Architecture, Database Dictionary & Viva Guide</div>
          <div class="badges">
            <span class="badge">FastAPI (Python 3.11)</span>
            <span class="badge">React 19 + TypeScript + Vite</span>
            <span class="badge">SQLModel & SQLite / PostgreSQL</span>
            <span class="badge">Tailwind CSS Modern UI</span>
            <span class="badge">Multi-Role RBAC (Admin, Teacher, Student)</span>
            <span class="badge">Academic Viva Ready</span>
          </div>
        </div>
        """,
        "header_title": "Project Documentation & Architecture Kit"
    },
    {
        "input_md": "PROJECT_GUIDE_ROMAN_URDU.md",
        "output_pdf": "PROJECT_GUIDE_ROMAN_URDU.pdf",
        "title": "Centralized College LMS 2.0 - Aasan Project Guide (Roman Urdu)",
        "banner": """
        <div class="doc-banner">
          <h1>Centralized College LMS (Learning Management System)</h1>
          <div class="subtitle">Aasan aur Detailed Project Guide — Viva Presentation, System Flow aur Code Architecture</div>
          <div class="badges">
            <span class="badge">Roman Urdu Explanation</span>
            <span class="badge">Complete System Flow</span>
            <span class="badge">Admin, Teacher & Student Panels</span>
            <span class="badge">Top Viva Questions & Answers</span>
            <span class="badge">Live Demo Checklist</span>
          </div>
        </div>
        """,
        "header_title": "Aasan Project Guide (Roman Urdu)"
    }
]


async def generate_pdfs():
    print("=" * 70)
    print("Generating High Quality PDF Documentation for College LMS 2.0")
    print("=" * 70)

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="chrome", headless=True)

        for doc in DOCS:
            md_path = DOCS_DIR / doc["input_md"]
            pdf_path = DOCS_DIR / doc["output_pdf"]

            if not md_path.exists():
                print(f"[!] Warning: File not found: {md_path}")
                continue

            print(f"\n[+] Processing: {doc['input_md']} -> {doc['output_pdf']}...")
            with open(md_path, "r", encoding="utf-8") as f:
                md_content = f.read()

            # Prepare HTML
            html = HTML_SHELL.replace("__PAGE_TITLE__", doc["title"])
            html = html.replace("__BANNER_HTML__", doc["banner"])

            page = await browser.new_page()
            await page.set_content(html, wait_until="networkidle")

            # Call renderDoc with markdown content
            res = await page.evaluate("async (md) => await window.renderDoc(md)", md_content)
            print(f"    - Markdown parsed & {res.get('count', 0)} Mermaid diagrams rendered.")

            # Give a short breather for layout settling
            await asyncio.sleep(1.0)

            # Generate PDF with header and footer
            header_html = f"""
            <div style="font-size: 8px; color: #64748b; width: 100%; display: flex; justify-content: space-between; padding: 0 16mm; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border-bottom: 0.5px solid #cbd5e1; padding-bottom: 4px;">
              <span style="font-weight: 700; color: #1e3a8a;">College LMS 2.0</span>
              <span>{doc['header_title']}</span>
            </div>
            """

            footer_html = """
            <div style="font-size: 8px; color: #64748b; width: 100%; display: flex; justify-content: space-between; padding: 0 16mm; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border-top: 0.5px solid #cbd5e1; padding-top: 4px;">
              <span>Centralized College Learning Management System &copy; 2026</span>
              <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            </div>
            """

            await page.pdf(
                path=str(pdf_path),
                format="A4",
                print_background=True,
                margin={
                    "top": "22mm",
                    "bottom": "22mm",
                    "left": "16mm",
                    "right": "16mm"
                },
                display_header_footer=True,
                header_template=header_html,
                footer_template=footer_html
            )

            file_size_kb = pdf_path.stat().st_size / 1024
            print(f"    [OK] Successfully created {pdf_path.name} ({file_size_kb:.1f} KB)")
            await page.close()

        await browser.close()

    print("\n" + "=" * 70)
    print("All Documentation PDFs Generated Successfully!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(generate_pdfs())
