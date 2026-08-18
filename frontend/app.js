/**
 * HManga Library — Core Frontend JavaScript Utility
 */

const API_BASE = window.location.port === '8000' || window.location.port === '3000' 
    ? `${window.location.protocol}//${window.location.hostname}:8000` 
    : 'http://localhost:8000';

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ==================== API CLIENT ====================
const api = {
    async getComics(params = {}) {
        const query = new URLSearchParams();
        if (params.status) query.set('status', params.status);
        if (params.tag) query.set('tag', params.tag);
        if (params.q) query.set('q', params.q);
        const res = await fetch(`${API_BASE}/api/comics${query.toString() ? '?' + query.toString() : ''}`);
        if (!res.ok) throw new Error('Không thể tải danh sách truyện');
        return res.json();
    },

    async getComic(id) {
        const res = await fetch(`${API_BASE}/api/comics/${id}`);
        if (!res.ok) throw new Error('Không tìm thấy truyện');
        return res.json();
    },

    async createComic(data) {
        const res = await fetch(`${API_BASE}/api/comics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Lỗi khi tạo truyện');
        return res.json();
    },

    async updateComic(id, data) {
        const res = await fetch(`${API_BASE}/api/comics/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Lỗi khi cập nhật truyện');
        return res.json();
    },

    async deleteComic(id) {
        const res = await fetch(`${API_BASE}/api/comics/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Lỗi khi xóa truyện');
        return res.json();
    },

    async createChapter(comicId, data) {
        const res = await fetch(`${API_BASE}/api/comics/${comicId}/chapters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Lỗi khi thêm chương');
        return res.json();
    },

    async updateChapter(chapterId, data) {
        const res = await fetch(`${API_BASE}/api/chapters/${chapterId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Lỗi khi cập nhật chương');
        return res.json();
    },

    async deleteChapter(chapterId) {
        const res = await fetch(`${API_BASE}/api/chapters/${chapterId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Lỗi khi xóa chương');
        return res.json();
    },

    async getChapterPages(chapterId) {
        const res = await fetch(`${API_BASE}/api/chapters/${chapterId}/pages`);
        if (!res.ok) throw new Error('Không thể tải danh sách trang');
        return res.json();
    },

    async downloadCover(url, comicId) {
        const res = await fetch(`${API_BASE}/api/images/download-cover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, comic_id: comicId })
        });
        if (!res.ok) console.warn('Không thể tải cover image tự động');
        return res.json();
    },

    async searchComics(params = {}) {
        const query = new URLSearchParams();
        if (params.q) query.set('q', params.q);
        if (params.tag) query.set('tag', params.tag);
        if (params.status) query.set('status', params.status);
        if (params.author) query.set('author', params.author);
        const res = await fetch(`${API_BASE}/api/search?${query.toString()}`);
        if (!res.ok) throw new Error('Lỗi tìm kiếm');
        return res.json();
    },

    async checkComicByGalleryId(galleryId) {
        const res = await fetch(`${API_BASE}/api/comics/check/${galleryId}`);
        if (!res.ok) return { exists: false };
        return res.json();
    },

    getCoverUrl(filename) {
        if (!filename) return 'rem.jpg';
        return `${API_BASE}/api/covers/${filename}`;
    }
};

// ==================== URL PARSER ====================
function parseHentaifoxUrl(url) {
    if (!url) return null;
    const match = url.trim().match(/^(.*\/)(\d+)([a-zA-Z]*)\.(\w+)(\?.*)?$/);
    if (!match) return null;

    const prefix = match[1];
    const pageNumber = parseInt(match[2], 10);
    const suffix = match[3] || '';
    const extension = match[4];

    const galleryMatch = prefix.match(/\/(\d+)\/$/);
    const galleryId = galleryMatch ? galleryMatch[1] : '';

    return { prefix, pageNumber, suffix, extension, galleryId };
}

function generatePageUrls(baseUrl, totalPages) {
    const parsed = parseHentaifoxUrl(baseUrl);
    if (!parsed) {
        return Array.from({ length: totalPages }, () => baseUrl);
    }
    return Array.from({ length: totalPages }, (_, i) => {
        const pageNum = i + 1;
        return `${parsed.prefix}${pageNum}${parsed.suffix}.${parsed.extension}`;
    });
}

function extractGalleryId(url) {
    const parsed = parseHentaifoxUrl(url);
    return parsed ? parsed.galleryId : null;
}

// ==================== TAG INPUT COMPONENT ====================
class TagInputComponent {
    constructor(containerId, initialTags = []) {
        this.container = document.getElementById(containerId);
        this.tags = [...initialTags];
        this.init();
    }

    init() {
        if (!this.container) return;
        this.container.className = 'tag-input-container';
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        this.tags.forEach((tag, idx) => {
            const badge = document.createElement('span');
            badge.className = 'tag-badge';
            badge.innerHTML = `${tag} <span class="tag-remove" data-idx="${idx}">×</span>`;
            this.container.appendChild(badge);
        });

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tag-text-input';
        input.placeholder = this.tags.length === 0 ? 'Nhập tag rồi Enter hoặc dấu phẩy...' : '';
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const val = input.value.trim().toLowerCase().replace(',', '');
                if (val && !this.tags.includes(val)) {
                    this.tags.push(val);
                    this.render();
                    const newInput = this.container.querySelector('.tag-text-input');
                    if (newInput) newInput.focus();
                }
            } else if (e.key === 'Backspace' && input.value === '' && this.tags.length > 0) {
                this.tags.pop();
                this.render();
                const newInput = this.container.querySelector('.tag-text-input');
                if (newInput) newInput.focus();
            }
        });

        this.container.appendChild(input);

        this.container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'), 10);
                this.tags.splice(idx, 1);
                this.render();
            });
        });
    }

    getTags() {
        return this.tags;
    }

    setTags(tags) {
        this.tags = [...tags];
        this.render();
    }
}
