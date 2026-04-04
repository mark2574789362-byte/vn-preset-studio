import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Zap, Heart, FileText, ShieldCheck, Upload, Link2, X, CheckCircle, AlertCircle, Loader, Wand2, ArrowRight } from 'lucide-react';
import jsQR from 'jsqr';

// =============================================================================
// Locales - 中英文完全分离，维护时只修改对应语言块
// =============================================================================
const locales = {
  en: {
    brand: 'VN Studio',
    nav: {
      tool: 'Tool',
      gallery: 'Gallery',
      pricing: 'Pricing',
      docs: 'Docs',
      langBtn: '中文',
      start: 'Get Started',
    },
    hero: {
      title: 'VN QR Decoder',
      subtitle: 'Professional grade preset extraction for creators.',
      dropzone: 'DROP QR CODE HERE',
      dropzoneHint: 'or click to upload',
      scanTab: 'Scan QR',
      linkTab: 'CapCut Link',
      scanning: 'Scanning...',
      scanSuccess: 'QR Code Detected!',
      scanError: 'No QR code found',
      linkPlaceholder: 'Paste CapCut template link here...',
      linkFetch: 'Preview',
      linkFetching: 'Fetching preview...',
      linkSuccess: 'Template Preview',
      linkError: 'Failed to fetch preview',
      linkHint: 'Paste a CapCut template share link to preview it',
      copyBtn: 'Copy',
      copied: 'Copied!',
      resetBtn: 'Scan Again',
    },
    gallery: {
      title: 'Community Gallery',
      subtitle: 'Trending presets from global creators.',
      preview: 'PRESET_PREVIEW',
      creator: '@Creator_',
    },
    pricing: {
      popular: 'POPULAR',
      free: {
        name: 'Free',
        price: '$0',
        btn: 'Current Plan',
        feat: [
          '5 Scans per Day',
          'Basic Parameter View',
          'Community Access',
        ],
      },
      pro: {
        name: 'Pro',
        price: '$9',
        btn: 'Upgrade Now',
        feat: [
          'Export as .CUBE LUTs',
          'Batch Processing',
          'Private Cloud Library',
        ],
      },
      enterprise: {
        name: 'Studio',
        price: 'Custom',
        btn: 'Contact Sales',
        feat: [
          'Team Shared Workspace',
          'API Integration',
          'Priority Support',
        ],
      },
    },
    docs: {
      title: 'Documentation',
      desc: 'VN Preset Studio provides comprehensive documentation to help you automate your creative workflow. Learn how to bridge the gap between VN and desktop editors like Premiere and DaVinci.',
      btn1: 'Quick Start',
      btn2: 'API References',
      visual: '// Documentation Visual Placeholder',
    },
    footer: '© 2026 VN Preset Studio • Powered by Creators',
  },

  zh: {
    brand: 'VN 工作室',
    nav: {
      tool: '解析工具',
      gallery: '社区画廊',
      pricing: '订阅方案',
      docs: '使用文档',
      langBtn: 'English',
      start: '立即开始',
    },
    hero: {
      title: 'VN 二维码解析器',
      subtitle: '为创作者打造的专业级参数提取工具',
      dropzone: '拖拽二维码至此区',
      dropzoneHint: '或点击上传',
      scanTab: '扫码解析',
      linkTab: 'CapCut 链接',
      scanning: '解析中...',
      scanSuccess: '二维码识别成功！',
      scanError: '未检测到二维码',
      linkPlaceholder: '粘贴 CapCut 模板链接...',
      linkFetch: '获取预览',
      linkFetching: '获取预览中...',
      linkSuccess: '模板预览',
      linkError: '获取预览失败',
      linkHint: '粘贴 CapCut 分享链接即可预览模板效果',
      copyBtn: '复制',
      copied: '已复制！',
      resetBtn: '重新扫描',
    },
    gallery: {
      title: '社区画廊',
      subtitle: '来自全球创作者的热门预设',
      preview: '预设预览',
      creator: '@创作者_',
    },
    pricing: {
      popular: '最受欢迎',
      free: {
        name: '基础版',
        price: '免费',
        btn: '当前计划',
        feat: [
          '每日 5 次免费解析',
          '查看基础滤镜参数',
          '浏览社区公共画廊',
        ],
      },
      pro: {
        name: '专业版',
        price: '¥59',
        btn: '立即升级',
        feat: [
          '导出通用 LUT (.CUBE)',
          '一键批量解析多张',
          '无限容量私密收藏夹',
        ],
      },
      enterprise: {
        name: '工作室版',
        price: '定制',
        btn: '联系销售',
        feat: [
          '团队资产共享库',
          'API 自动化调用接口',
          '专属技术支持',
        ],
      },
    },
    docs: {
      title: '使用文档',
      desc: '我们提供完整的文档说明，帮助您将工作流自动化。轻松掌握如何将 VN 的色彩数据无损转换至 Premiere、剪映等桌面端编辑器。',
      btn1: '快速入门',
      btn2: 'API 接口参考',
      visual: '// 文档演示插图',
    },
    footer: '© 2026 VN Preset Studio • 创作者的生产力工具',
  },
};

// =============================================================================
// QR Scanner Component
// =============================================================================
interface ScanResult {
  data: string;
  isCapCut: boolean;
}

function QRScanner({ lang, onCapCutLink }: { lang: 'en' | 'zh'; onCapCutLink: (link: string) => void }) {
  const t = locales[lang].hero;
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    setScanning(true);
    setError(null);
    setResult(null);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const code = jsQR(imageData.data, img.width, img.height);
      if (code) {
        setResult({ data: code.data, isCapCut: code.data.includes('capcut') || code.data.includes('jiyong') });
      } else {
        setError(t.scanError);
      }
      setScanning(false);
    };
    img.src = URL.createObjectURL(file);
  }, [t.scanError]);

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) processImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(result.data);
  };

  const handleJump = () => {
    if (result?.isCapCut) {
      onCapCutLink(result.data);
    } else {
      window.open(result?.data, '_blank');
    }
  };

  if (result) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30 mb-4">
          <div className="flex items-center gap-2 text-green-400 mb-3">
            <CheckCircle size={20} />
            <span className="font-semibold">{t.scanSuccess}</span>
          </div>
          <div className="bg-black/40 rounded-xl p-4 font-mono text-sm text-white/80 break-all mb-4">
            {result.data}
          </div>
          <div className="flex gap-3">
            <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-all">
              {t.copyBtn}
            </button>
            {result.isCapCut && (
              <button onClick={handleJump} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition-all">
                Open in CapCut <ArrowRight size={14} />
              </button>
            )}
            <button onClick={() => { setResult(null); setError(null); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-all">
              {t.resetBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-2xl mx-auto aspect-video rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3
        ${dragging ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-purple-500/40'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      {scanning ? (
        <div className="flex flex-col items-center gap-3 text-purple-400">
          <Loader size={48} className="animate-spin" />
          <span className="text-sm font-medium">{t.scanning}</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 text-red-400/60">
          <AlertCircle size={48} />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="text-xs text-white/40 hover:text-white transition-colors">{t.resetBtn}</button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-gray-400 transition-colors">
          <Zap size={48} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
          <span className="font-medium tracking-wide">{t.dropzone}</span>
          <span className="text-xs text-gray-600">{t.dropzoneHint}</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CapCut Link Preview Component
// =============================================================================
interface OGData {
  title: string;
  description: string;
  image: string;
  url: string;
}

function CapCutPreview({ lang, capCutLink }: { lang: 'en' | 'zh'; capCutLink: string }) {
  const t = locales[lang].hero;
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [og, setOg] = useState<OGData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync when parent passes a new capCutLink (e.g. from QR scan)
  useEffect(() => {
    if (capCutLink) setLink(capCutLink);
  }, [capCutLink]);

  const fetchPreview = async () => {
    if (!link.trim()) return;
    setLoading(true);
    setError(null);
    setOg(null);
    try {
      // Use corsproxy.io as CORS proxy
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(link)}`;
      const res = await fetch(proxyUrl);
      const html = await res.text();
      const get = (k: string) => {
        const m = html.match(new RegExp(`<meta[^>]+${k}[^>]+content=["']([^"']+)["']`, 'i')) ||
                   html.match(new RegExp(`content=["']([^"']+)["'][^>]+${k}`, 'i'));
        return m ? m[1] : '';
      };
      const ogTitle = get('property="og:title"') || get('name="title"');
      const ogDesc = get('property="og:description"') || get('name="description"');
      const ogImage = get('property="og:image"');
      setOg({
        title: ogTitle || 'CapCut Template',
        description: ogDesc || '',
        image: ogImage || '',
        url: link,
      });
    } catch {
      setError(t.linkError);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchPreview();
  };

  if (og) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          {og.image && (
            <div className="aspect-video bg-neutral-900">
              <img src={og.image} alt={og.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-bold text-white mb-1">{og.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">{og.description}</p>
              </div>
              <a
                href={og.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold transition-all"
              >
                Open <ArrowRight size={12} />
              </a>
            </div>
            <button onClick={() => { setOg(null); setLink(''); }} className="text-xs text-gray-500 hover:text-white transition-colors">
              {t.resetBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={link}
            onChange={e => setLink(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.linkPlaceholder}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
        <button
          onClick={fetchPreview}
          disabled={loading || !link.trim()}
          className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition-all flex items-center gap-2"
        >
          {loading ? <Loader size={14} className="animate-spin" /> : <Wand2 size={14} />}
          {loading ? t.linkFetching : t.linkFetch}
        </button>
      </div>
      {error ? (
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-red-400/80 flex items-center gap-2 mb-3"><AlertCircle size={14} />{error}</p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition-all"
          >
            Open CapCut Template <ArrowRight size={14} />
          </a>
        </div>
      ) : (
        <p className="mt-3 text-xs text-gray-600">{t.linkHint}</p>
      )}
    </div>
  );
}

// =============================================================================
// App
// =============================================================================
export default function App() {
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [activeTab, setActiveTab] = useState<'scan' | 'link'>('scan');
  const [capCutLink, setCapCutLink] = useState('');
  const t = locales[lang];

  const handleCapCutLink = (link: string) => {
    setCapCutLink(link);
    setActiveTab('link');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-purple-500/30 font-sans">
      {/* 导航栏 */}
      <nav className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
              {t.brand}
            </span>
            <div className="hidden md:flex gap-6 text-sm text-gray-400">
              <a href="#tool" className="hover:text-white transition-colors">{t.nav.tool}</a>
              <a href="#gallery" className="hover:text-white transition-colors">{t.nav.gallery}</a>
              <a href="#pricing" className="hover:text-white transition-colors">{t.nav.pricing}</a>
              <a href="#docs" className="hover:text-white transition-colors">{t.nav.docs}</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 text-xs font-medium transition-all"
            >
              <Globe size={14} /> {t.nav.langBtn}
            </button>
            <button className="bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-full text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-purple-500/20">
              {t.nav.start}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 space-y-40">
        {/* 工具区 */}
        <section id="tool" className="max-w-4xl mx-auto text-center scroll-mt-32">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight"
          >
            {t.hero.title}
          </motion.h1>
          <p className="text-gray-400 text-xl mb-12 font-light">{t.hero.subtitle}</p>

          {/* 功能 Tab 切换 */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-full bg-white/5 border border-white/10">
              <button
                onClick={() => setActiveTab('scan')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'scan' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                <Upload size={14} /> {t.hero.scanTab}
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'link' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                <Link2 size={14} /> {t.hero.linkTab}
              </button>
            </div>
          </div>

          {/* 功能面板 */}
          <AnimatePresence mode="wait">
            {activeTab === 'scan' ? (
              <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <QRScanner lang={lang} onCapCutLink={handleCapCutLink} />
              </motion.div>
            ) : (
              <motion.div key="link" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <CapCutPreview lang={lang} capCutLink={capCutLink} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 画廊区 */}
        <section id="gallery" className="max-w-7xl mx-auto scroll-mt-32">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">{t.gallery.title}</h2>
            <p className="text-gray-500 text-sm">{t.gallery.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <motion.div
                key={i}
                whileHover={{ y: -8 }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="aspect-[4/3] rounded-xl bg-neutral-900 mb-4 flex items-center justify-center text-white/5 font-mono text-[10px]">
                  {t.gallery.preview}_{i}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 opacity-80" />
                    <span className="text-xs text-gray-400">{t.gallery.creator}{i}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <Heart size={12} /> {i * 24}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 商业定价区 */}
        <section id="pricing" className="max-w-6xl mx-auto scroll-mt-32">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">

            {/* Free */}
            <div className="flex-1 p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col min-h-[520px]">
              <div className="mb-8">
                <h3 className="text-gray-400 font-medium mb-2">{t.pricing.free.name}</h3>
                <div className="text-4xl font-bold">{t.pricing.free.price}</div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {t.pricing.free.feat.map(f => (
                  <li key={f} className="text-sm text-gray-500 flex items-center gap-2">✓ {f}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all text-sm font-semibold">
                {t.pricing.free.btn}
              </button>
            </div>

            {/* Pro */}
            <div className="flex-1 relative group p-8 rounded-3xl bg-white/5 border border-purple-500/20 flex flex-col min-h-[520px] transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]">
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500/40 rounded-3xl transition-all duration-700 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-purple-400 font-bold mb-2">{t.pricing.pro.name}</h3>
                    <div className="text-4xl font-bold">{t.pricing.pro.price}</div>
                  </div>
                  <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded-full font-bold tracking-widest uppercase">
                    {t.pricing.popular}
                  </span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  {t.pricing.pro.feat.map(f => (
                    <li key={f} className="text-sm text-purple-100/70 flex items-center gap-2">
                      <Zap size={14} className="text-purple-400" /> {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition-all text-sm font-bold shadow-lg shadow-purple-500/25">
                  {t.pricing.pro.btn}
                </button>
              </div>
            </div>

            {/* Enterprise */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="flex-1 p-8 rounded-3xl bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/30 flex flex-col min-h-[520px] shadow-[0_0_50px_rgba(59,130,246,0.03)] hover:shadow-blue-500/10 transition-all"
            >
              <div className="mb-8">
                <h3 className="text-blue-400 font-bold mb-2">{t.pricing.enterprise.name}</h3>
                <div className="text-4xl font-bold tracking-tight">{t.pricing.enterprise.price}</div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {t.pricing.enterprise.feat.map(f => (
                  <li key={f} className="text-sm text-blue-100/60 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-400" /> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all text-sm font-bold">
                {t.pricing.enterprise.btn}
              </button>
            </motion.div>
          </div>
        </section>

        {/* 文档区 */}
        <section id="docs" className="max-w-4xl mx-auto scroll-mt-32 pt-20 border-t border-white/5">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1">
              <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 text-purple-400 mb-6">
                <FileText size={24} />
              </div>
              <h2 className="text-3xl font-bold mb-6">{t.docs.title}</h2>
              <p className="text-gray-400 leading-relaxed mb-8 text-lg">{t.docs.desc}</p>
              <div className="flex gap-4">
                <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all text-sm font-medium">
                  {t.docs.btn1}
                </button>
                <button className="px-6 py-2.5 rounded-xl text-sm text-gray-500 hover:text-white transition-colors">
                  {t.docs.btn2}
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-white/5 aspect-square rounded-[2rem] border border-white/5 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 group-hover:opacity-50 transition-opacity" />
              <code className="text-purple-500/30 text-xs font-mono">{t.docs.visual}</code>
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="py-24 text-center border-t border-white/5">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em]">{t.footer}</p>
      </footer>
    </div>
  );
}
