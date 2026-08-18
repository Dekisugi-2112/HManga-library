/**
 * HManga Library — Core Frontend JavaScript Utility
 * =================================================
 * File tiện ích dùng chung cho toàn bộ giao diện Frontend.
 * Bao gồm:
 * 1. Cấu hình địa chỉ backend API (API_BASE).
 * 2. Hệ thống hiển thị thông báo Toast Notification.
 * 3. Module `api` chứa toàn bộ các hàm gọi RESTful API tới Backend (Comics, Chapters, Genres, Authors).
 * 4. Tiện ích phân tích cú pháp URL hentaifox (`parseHentaifoxUrl`, `generatePageUrls`, `extractGalleryId`).
 * 5. Thành phần chọn thể loại trực quan dạng Chips (`GenreSelectorComponent`).
 */

// Tự động nhận diện URL Backend API dựa theo môi trường hiện tại
const API_BASE = window.location.port === '8000' || window.location.port === '3000' 
    ? `${window.location.protocol}//${window.location.hostname}:8000` 
    : 'http://localhost:8000';

// ==================== 1. TOAST NOTIFICATION ====================
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

// ==================== 2. API CLIENT ====================
const api = {
    // === COMICS ===
    async getComics(params = {}) {
        const query = new URLSearchParams();
        if (params.genre) query.set('genre', params.genre);
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

    // === CHAPTERS ===
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

    // === IMAGES ===
    async downloadCover(url, comicId) {
        const res = await fetch(`${API_BASE}/api/images/download-cover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, comic_id: comicId })
        });
        if (!res.ok) console.warn('Không thể tải cover image tự động');
        return res.json();
    },

    // === SEARCH ===
    async searchComics(params = {}) {
        const query = new URLSearchParams();
        if (params.q) query.set('q', params.q);
        if (params.genre) query.set('genre', params.genre);
        if (params.author) query.set('author', params.author);
        const res = await fetch(`${API_BASE}/api/search?${query.toString()}`);
        if (!res.ok) throw new Error('Lỗi tìm kiếm');
        return res.json();
    },

    // === CHECK EXISTING ===
    async checkComicByGalleryId(galleryId) {
        const res = await fetch(`${API_BASE}/api/comics/check/${galleryId}`);
        if (!res.ok) return { exists: false };
        return res.json();
    },

    getCoverUrl(filename) {
        if (!filename) return 'rem.jpg';
        return `${API_BASE}/api/covers/${filename}`;
    },

    // === GENRES (THỂ LOẠI) MANAGEMENT ===
    async getGenres() {
        const res = await fetch(`${API_BASE}/api/genres`);
        if (!res.ok) throw new Error('Không thể tải danh sách thể loại');
        return res.json();
    },

    async createGenre(name) {
        const res = await fetch(`${API_BASE}/api/genres`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Lỗi khi thêm thể loại');
        return res.json();
    },

    async updateGenre(genreId, name) {
        const res = await fetch(`${API_BASE}/api/genres/${genreId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Lỗi khi cập nhật thể loại');
        return res.json();
    },

    async deleteGenre(genreId) {
        const res = await fetch(`${API_BASE}/api/genres/${genreId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Lỗi khi xóa thể loại');
        return res.json();
    },

    async getComicsByGenre(genreId) {
        const res = await fetch(`${API_BASE}/api/genres/${genreId}/comics`);
        if (!res.ok) throw new Error('Không thể tải danh sách truyện theo thể loại');
        return res.json();
    },

    // === AUTHORS MANAGEMENT ===
    async getAuthors() {
        const res = await fetch(`${API_BASE}/api/authors`);
        if (!res.ok) throw new Error('Không thể tải danh sách tác giả');
        return res.json();
    },

    async renameAuthor(oldName, newName) {
        const res = await fetch(`${API_BASE}/api/authors/rename`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_name: oldName, new_name: newName })
        });
        if (!res.ok) throw new Error('Lỗi khi đổi tên tác giả');
        return res.json();
    },

    async getComicsByAuthor(authorName) {
        const res = await fetch(`${API_BASE}/api/authors/${encodeURIComponent(authorName)}/comics`);
        if (!res.ok) throw new Error('Không thể tải truyện theo tác giả');
        return res.json();
    }
};

// ==================== 3. URL PARSER ====================
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

// ==================== 4. GENRE SELECTOR COMPONENT ====================
/**
 * Component chọn Thể loại dạng Chips (Click để chọn/bỏ chọn).
 * Người dùng KHÔNG nhập chữ mà chỉ chọn từ danh sách thể loại có sẵn.
 */
class GenreSelectorComponent {
    constructor(containerId, availableGenres = [], selectedGenres = []) {
        this.container = document.getElementById(containerId);
        this.availableGenres = [...availableGenres];
        this.selectedGenres = new Set(selectedGenres.map(g => g.toLowerCase().trim()));
        this.init();
    }

    init() {
        if (!this.container) return;
        this.render();
    }

    setAvailableGenres(genres) {
        this.availableGenres = [...genres];
        this.render();
    }

    setSelectedGenres(genres) {
        this.selectedGenres = new Set(genres.map(g => g.toLowerCase().trim()));
        this.render();
    }

    getSelectedGenres() {
        return Array.from(this.selectedGenres);
    }

    toggleGenre(genreName) {
        const key = genreName.toLowerCase().trim();
        if (this.selectedGenres.has(key)) {
            this.selectedGenres.delete(key);
        } else {
            this.selectedGenres.add(key);
        }
        this.render();
    }

    render() {
        if (!this.container) return;
        if (this.availableGenres.length === 0) {
            this.container.innerHTML = `
                <div style="padding: 10px; color: var(--text-dim); font-size: 13px;">
                    Chưa có thể loại nào trong hệ thống. <a href="genres.html" style="color: var(--primary);">Bấm vào đây để thêm thể loại</a>
                </div>
            `;
            return;
        }

        this.container.className = 'genre-select-container';
        this.container.innerHTML = this.availableGenres.map(genre => {
            const name = typeof genre === 'string' ? genre : genre.name;
            const isSelected = this.selectedGenres.has(name.toLowerCase().trim());
            return `
                <button type="button" class="genre-chip-btn ${isSelected ? 'active' : ''}" data-name="${name}">
                    <span class="genre-check">${isSelected ? '✓' : '+'}</span>
                    <span>${name}</span>
                </button>
            `;
        }).join('');

        this.container.querySelectorAll('.genre-chip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.getAttribute('data-name');
                this.toggleGenre(name);
            });
        });
    }
}

// ==================== 5. AUTHOR AUTOCOMPLETE COMPONENT ====================
/**
 * Component gợi ý tác giả thông minh:
 * - Khi người dùng gõ tên: tìm kiếm tức thì trong danh sách tác giả đã có.
 * - Nếu có tác giả phù hợp: hiển thị danh sách để click chọn.
 * - Nếu là tác giả mới: hiển thị gợi ý "➕ Dùng tác giả mới" và tự động tạo mới khi lưu.
 */
class AuthorAutocompleteComponent {
    constructor(inputId, authors = []) {
        this.input = document.getElementById(inputId);
        this.authors = [...authors];
        this.selectedIndex = -1;
        this.init();
    }

    setAuthors(authors) {
        this.authors = [...authors];
    }

    init() {
        if (!this.input) return;

        // Bọc ô input vào wrapper nếu chưa bọc
        let wrapper = this.input.parentElement;
        if (!wrapper.classList.contains('autocomplete-wrapper')) {
            wrapper = document.createElement('div');
            wrapper.className = 'autocomplete-wrapper';
            this.input.parentNode.insertBefore(wrapper, this.input);
            wrapper.appendChild(this.input);
        }

        // Tạo dropdown menu gợi ý
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'autocomplete-dropdown';
        wrapper.appendChild(this.dropdown);

        // Sự kiện gõ phím & focus
        this.input.addEventListener('input', () => this.onInput());
        this.input.addEventListener('focus', () => this.onInput());

        // Hỗ trợ điều hướng bằng phím mũi tên / Enter / Esc
        this.input.addEventListener('keydown', (e) => {
            const items = this.dropdown.querySelectorAll('.autocomplete-item');
            if (!this.dropdown.classList.contains('active') || items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % items.length;
                this.updateFocus(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
                this.updateFocus(items);
            } else if (e.key === 'Enter') {
                if (this.selectedIndex >= 0 && this.selectedIndex < items.length) {
                    e.preventDefault();
                    items[this.selectedIndex].click();
                }
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });

        // Đóng dropdown khi bấm ra ngoài
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                this.hide();
            }
        });
    }

    onInput() {
        const query = this.input.value.trim().toLowerCase();
        this.renderDropdown(query);
    }

    updateFocus(items) {
        items.forEach((item, i) => {
            if (i === this.selectedIndex) {
                item.classList.add('focused');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('focused');
            }
        });
    }

    selectAuthor(name) {
        this.input.value = name;
        this.hide();
        this.input.dispatchEvent(new Event('change'));
    }

    hide() {
        this.dropdown.classList.remove('active');
        this.selectedIndex = -1;
    }

    renderDropdown(query) {
        const rawVal = this.input.value.trim();
        const matches = this.authors.filter(a => {
            const name = (typeof a === 'string' ? a : a.name).toLowerCase();
            return !query || name.includes(query);
        });

        const exactMatch = this.authors.some(a => {
            const name = typeof a === 'string' ? a : a.name;
            return name.toLowerCase() === query;
        });

        let html = '';

        // Nếu đã gõ chữ và chưa trùng khớp 100% với tác giả cũ -> hiện nút thêm mới
        if (rawVal && !exactMatch) {
            html += `
                <div class="autocomplete-item autocomplete-item-new" data-val="${rawVal}">
                    <span>➕ Dùng tác giả mới: <b>"${rawVal}"</b></span>
                    <span class="autocomplete-badge">Mới</span>
                </div>
            `;
        }

        // Liệt kê các tác giả đã có khớp với từ khóa
        matches.forEach(item => {
            const name = typeof item === 'string' ? item : item.name;
            const count = typeof item === 'object' && item.comic_count !== undefined ? `${item.comic_count} truyện` : '';
            html += `
                <div class="autocomplete-item" data-val="${name}">
                    <span>✍️ ${name}</span>
                    ${count ? `<span class="autocomplete-badge">${count}</span>` : ''}
                </div>
            `;
        });

        if (!html) {
            this.hide();
            return;
        }

        this.dropdown.innerHTML = html;
        this.dropdown.classList.add('active');
        this.selectedIndex = -1;

        this.dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
            el.addEventListener('click', () => {
                const val = el.getAttribute('data-val');
                this.selectAuthor(val);
            });
        });
    }
}
