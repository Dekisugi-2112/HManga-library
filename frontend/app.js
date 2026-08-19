/**
 * HManga Library — Core Frontend JavaScript Utility (app.js)
 * ==========================================================
 * File tiện ích dùng chung cho toàn bộ giao diện người dùng (Frontend).
 * 
 * Chức năng chính:
 * 1. API_BASE: Tự động cấu hình URL Backend API (port 8000).
 * 2. showToast: Hiển thị thông báo nổi (Toast Notification) báo thành công/thất bại/cảnh báo.
 * 3. api: Module tập trung các hàm gọi RESTful API tới máy chủ (Comics, Chapters, Genres, Authors, Search, Images).
 * 4. URL Parser: Công cụ giải mã URL hentaifox (`parseHentaifoxUrl`, `generatePageUrls`, `extractGalleryId`).
 * 5. GenreSelectorComponent: Thành phần chọn thể loại dạng nút bấm (Chips) trực quan.
 * 6. AuthorAutocompleteComponent: Thành phần gợi ý và tìm kiếm tác giả thông minh (Autocomplete).
 */

// ==================== CẤU HÌNH API BASE ====================
// Tự động nhận diện URL Backend API dựa theo môi trường chạy của trình duyệt
const API_BASE = window.location.port === '8000' || window.location.port === '3000' 
    ? `${window.location.protocol}//${window.location.hostname}:8000` 
    : 'http://localhost:8000';

// ==================== 1. TOAST NOTIFICATION (THÔNG BÁO NỔI) ====================
/**
 * Hiển thị thông báo dạng Toast nổi ở góc màn hình:
 * @param {string} message - Nội dung thông báo hiển thị cho người dùng
 * @param {'info'|'success'|'error'|'warning'} type - Loại thông báo (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    // Nếu chưa có khung chứa toast thì tự động tạo mới gắn vào body
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    // Icon biểu thị trạng thái
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    // Tự động mờ dần và biến mất sau 3.5 giây
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ==================== 2. API CLIENT (MODULE GỌI BACKEND) ====================
/**
 * Đối tượng trung tâm chứa tất cả các phương thức gọi API tới Backend FastAPI
 */
const api = {
    // ------------------- TRUYỆN TRANH (COMICS) -------------------
    /**
     * Lấy danh sách tất cả các bộ truyện:
     * @param {Object} params - { genre: 'Action', q: 'tên truyện' }
     */
    async getComics(params = {}) {
        const query = new URLSearchParams();
        if (params.genre) query.set('genre', params.genre);
        if (params.q) query.set('q', params.q);
        const res = await fetch(`${API_BASE}/api/comics${query.toString() ? '?' + query.toString() : ''}`);
        if (!res.ok) throw new Error('Không thể tải danh sách truyện');
        return res.json();
    },

    /**
     * Lấy thông tin chi tiết của 1 bộ truyện theo ID (kèm chapters và genres)
     */
    async getComic(id) {
        const res = await fetch(`${API_BASE}/api/comics/${id}`);
        if (!res.ok) throw new Error('Không tìm thấy truyện');
        return res.json();
    },

    /**
     * Gửi yêu cầu tạo mới một bộ truyện
     */
    async createComic(data) {
        const res = await fetch(`${API_BASE}/api/comics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Lỗi khi tạo truyện');
        return res.json();
    },

    /**
     * Cập nhật thông tin của một bộ truyện
     */
    async updateComic(id, data) {
        const res = await fetch(`${API_BASE}/api/comics/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Lỗi khi cập nhật truyện');
        return res.json();
    },

    /**
     * Xóa vĩnh viễn một bộ truyện khỏi hệ thống
     */
    async deleteComic(id) {
        const res = await fetch(`${API_BASE}/api/comics/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Lỗi khi xóa truyện');
        return res.json();
    },

    // ------------------- CHƯƠNG TRUYỆN (CHAPTERS) -------------------
    /**
     * Thêm một chương mới cho bộ truyện
     */
    async createChapter(comicId, data) {
        const res = await fetch(`${API_BASE}/api/comics/${comicId}/chapters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Lỗi khi thêm chương');
        return res.json();
    },

    /**
     * Cập nhật thông tin một chương (số chương, tiêu đề)
     */
    async updateChapter(chapterId, data) {
        const res = await fetch(`${API_BASE}/api/chapters/${chapterId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Lỗi khi cập nhật chương');
        return res.json();
    },

    /**
     * Xóa một chương khỏi bộ truyện
     */
    async deleteChapter(chapterId) {
        const res = await fetch(`${API_BASE}/api/chapters/${chapterId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Lỗi khi xóa chương');
        return res.json();
    },

    /**
     * Lấy danh sách toàn bộ URL ảnh đọc truyện của một chương (từ trang 1 đến total_pages)
     */
    async getChapterPages(chapterId) {
        const res = await fetch(`${API_BASE}/api/chapters/${chapterId}/pages`);
        if (!res.ok) throw new Error('Không thể tải danh sách trang');
        return res.json();
    },

    // ------------------- HÌNH ẢNH (IMAGES & COVERS) -------------------
    /**
     * Yêu cầu Backend tải ảnh bìa từ hentaifox về lưu tại local thư mục cover-images/
     */
    async downloadCover(url, comicId) {
        const res = await fetch(`${API_BASE}/api/images/download-cover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, comic_id: comicId })
        });
        if (!res.ok) console.warn('Không thể tải cover image tự động');
        return res.json();
    },

    /**
     * Lấy đường dẫn URL xem ảnh bìa (nếu chưa có hoặc lỗi thì dùng ảnh dự phòng rem.jpg)
     */
    getCoverUrl(filename) {
        if (!filename) return 'rem.jpg';
        return `${API_BASE}/api/covers/${filename}`;
    },

    // ------------------- TÌM KIẾM (SEARCH) -------------------
    /**
     * Tìm kiếm truyện kết hợp theo: từ khóa tên (q), thể loại (genre), tác giả (author)
     */
    async searchComics(params = {}) {
        const query = new URLSearchParams();
        if (params.q) query.set('q', params.q);
        if (params.genre) query.set('genre', params.genre);
        if (params.author) query.set('author', params.author);
        const res = await fetch(`${API_BASE}/api/search?${query.toString()}`);
        if (!res.ok) throw new Error('Lỗi tìm kiếm');
        return res.json();
    },

    /**
     * Kiểm tra xem bộ truyện đã có trong thư viện chưa thông qua gallery_id
     */
    async checkComicByGalleryId(galleryId) {
        const res = await fetch(`${API_BASE}/api/comics/check/${galleryId}`);
        if (!res.ok) return { exists: false };
        return res.json();
    },

    // ------------------- THỂ LOẠI (GENRES) -------------------
    /**
     * Lấy danh sách toàn bộ thể loại kèm số lượng truyện
     */
    async getGenres() {
        const res = await fetch(`${API_BASE}/api/genres`);
        if (!res.ok) throw new Error('Không thể tải danh sách thể loại');
        return res.json();
    },

    /**
     * Thêm mới một thể loại
     */
    async createGenre(name) {
        const res = await fetch(`${API_BASE}/api/genres`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || 'Lỗi khi thêm thể loại');
        }
        return res.json();
    },

    /**
     * Đổi tên thể loại theo ID
     */
    async updateGenre(genreId, name) {
        const res = await fetch(`${API_BASE}/api/genres/${genreId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || 'Lỗi khi cập nhật thể loại');
        }
        return res.json();
    },

    /**
     * Xóa một thể loại khỏi database
     */
    async deleteGenre(genreId) {
        const res = await fetch(`${API_BASE}/api/genres/${genreId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Lỗi khi xóa thể loại');
        return res.json();
    },

    /**
     * Lấy danh sách các bộ truyện thuộc về một thể loại cụ thể
     */
    async getComicsByGenre(genreId) {
        const res = await fetch(`${API_BASE}/api/genres/${genreId}/comics`);
        if (!res.ok) throw new Error('Không thể tải danh sách truyện theo thể loại');
        return res.json();
    },

    // ------------------- TÁC GIẢ (AUTHORS) -------------------
    /**
     * Lấy danh sách toàn bộ tác giả và số lượng truyện của từng tác giả
     */
    async getAuthors() {
        const res = await fetch(`${API_BASE}/api/authors`);
        if (!res.ok) throw new Error('Không thể tải danh sách tác giả');
        return res.json();
    },

    /**
     * Đổi tên tác giả hàng loạt cho tất cả các bộ truyện của tác giả đó
     */
    async renameAuthor(oldName, newName) {
        const res = await fetch(`${API_BASE}/api/authors/rename`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_name: oldName, new_name: newName })
        });
        if (!res.ok) throw new Error('Lỗi khi đổi tên tác giả');
        return res.json();
    },

    /**
     * Lấy danh sách toàn bộ các bộ truyện của một tác giả cụ thể
     */
    async getComicsByAuthor(authorName) {
        const res = await fetch(`${API_BASE}/api/authors/${encodeURIComponent(authorName)}/comics`);
        if (!res.ok) throw new Error('Không thể tải truyện theo tác giả');
        return res.json();
    }
};

// ==================== 3. URL PARSER (BÓC TÁCH LINK HENTAIFOX) ====================
/**
 * Phân tích cấu trúc đường link ảnh từ hentaifox:
 * Ví dụ: "https://i3.hentaifox.com/004/4029076/1t.jpg"
 * -> prefix: "https://i3.hentaifox.com/004/4029076/"
 * -> pageNumber: 1
 * -> suffix: "t"
 * -> extension: "jpg"
 * -> galleryId: "4029076"
 */
function parseHentaifoxUrl(url) {
    if (!url) return null;
    const match = url.trim().match(/^(.*\/)(\d+)([a-zA-Z]*)\.(\w+)(\?.*)?$/);
    if (!match) return null;

    const prefix = match[1];
    const pageNumber = parseInt(match[2], 10);
    const suffix = match[3] || '';
    const extension = match[4];

    // Hỗ trợ trích xuất cả folder và gallery_id (VD: /001/48410/ -> "001-48410", hoặc /4029076/ -> "4029076")
    const folderGalleryMatch = prefix.match(/\/(\d+)\/(\d+)\/$/);
    let galleryId = '';
    if (folderGalleryMatch) {
        galleryId = `${folderGalleryMatch[1]}-${folderGalleryMatch[2]}`;
    } else {
        const singleMatch = prefix.match(/\/(\d+)\/$/);
        galleryId = singleMatch ? singleMatch[1] : '';
    }

    return { prefix, pageNumber, suffix, extension, galleryId };
}

/**
 * Tự động sinh danh sách toàn bộ URL ảnh từ trang startPage đến endPage:
 * - startPage: Trang bắt đầu (VD: 1, 15, 21...)
 * - endPage: Trang kết thúc (VD: 20, 35, 50...)
 */
function generatePageUrls(baseUrl, startPage = 1, endPage = 1) {
    const s = parseInt(startPage, 10) || 1;
    const e = parseInt(endPage, 10) || s;
    const start = Math.min(s, e);
    const end = Math.max(s, e);
    const total = end - start + 1;

    const parsed = parseHentaifoxUrl(baseUrl);
    if (!parsed) {
        return Array.from({ length: total }, () => baseUrl);
    }
    return Array.from({ length: total }, (_, i) => {
        const pageNum = start + i;
        return `${parsed.prefix}${pageNum}${parsed.suffix}.${parsed.extension}`;
    });
}

/**
 * Trích xuất gallery_id từ URL
 */
function extractGalleryId(url) {
    const parsed = parseHentaifoxUrl(url);
    return parsed ? parsed.galleryId : null;
}

// ==================== 4. GENRE SELECTOR COMPONENT (CHỌN THỂ LOẠI) ====================
/**
 * Component giao diện chọn Thể loại dạng nút bấm Chips:
 * - Người dùng bấm chọn trực tiếp từ danh sách có sẵn (không cần nhập tay).
 * - Hỗ trợ chọn/bỏ chọn nhiều thể loại (toggle).
 */
class GenreSelectorComponent {
    /**
     * @param {string} containerId - ID của thẻ div chứa danh sách chips
     * @param {Array} availableGenres - Danh sách thể loại có sẵn trong hệ thống
     * @param {Array} selectedGenres - Danh sách thể loại đang được chọn ban đầu
     */
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

    /** Cập nhật lại danh sách thể loại có sẵn từ máy chủ */
    setAvailableGenres(genres) {
        this.availableGenres = [...genres];
        this.render();
    }

    /** Thiết lập danh sách thể loại đang được chọn */
    setSelectedGenres(genres) {
        this.selectedGenres = new Set(genres.map(g => g.toLowerCase().trim()));
        this.render();
    }

    /** Lấy mảng danh sách tên các thể loại đang được chọn */
    getSelectedGenres() {
        return Array.from(this.selectedGenres);
    }

    /** Bật/tắt chọn một thể loại khi click */
    toggleGenre(genreName) {
        const key = genreName.toLowerCase().trim();
        if (this.selectedGenres.has(key)) {
            this.selectedGenres.delete(key);
        } else {
            this.selectedGenres.add(key);
        }
        this.render();
    }

    /** Vẽ lại giao diện danh sách các nút thể loại */
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

        // Lắng nghe sự kiện click trên từng chip thể loại
        this.container.querySelectorAll('.genre-chip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.getAttribute('data-name');
                this.toggleGenre(name);
            });
        });
    }
}

// ==================== 5. AUTHOR AUTOCOMPLETE COMPONENT (GỢI Ý TÁC GIẢ) ====================
/**
 * Component gợi ý và tìm kiếm tác giả thông minh:
 * - Khi người dùng gõ tên: tìm kiếm tức thì trong danh sách tác giả đã có.
 * - Nếu có tác giả phù hợp: hiển thị danh sách để click chọn.
 * - Nếu là tác giả mới: hiển thị gợi ý "➕ Dùng tác giả mới" và tự động tạo mới khi lưu.
 */
class AuthorAutocompleteComponent {
    /**
     * @param {string} inputId - ID của ô input nhập tên tác giả
     * @param {Array} authors - Danh sách các tác giả có sẵn trong thư viện
     */
    constructor(inputId, authors = []) {
        this.input = document.getElementById(inputId);
        this.authors = [...authors];
        this.selectedIndex = -1;
        this.init();
    }

    /** Cập nhật danh sách tác giả từ API */
    setAuthors(authors) {
        this.authors = [...authors];
    }

    /** Khởi tạo giao diện và gắn các bộ lắng nghe sự kiện */
    init() {
        if (!this.input) return;

        // Bọc ô input vào wrapper để định vị dropdown bên dưới
        let wrapper = this.input.parentElement;
        if (!wrapper.classList.contains('autocomplete-wrapper')) {
            wrapper = document.createElement('div');
            wrapper.className = 'autocomplete-wrapper';
            this.input.parentNode.insertBefore(wrapper, this.input);
            wrapper.appendChild(this.input);
        }

        // Tạo dropdown menu hiển thị gợi ý
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

        // Đóng dropdown khi bấm chuột ra ngoài ô input
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                this.hide();
            }
        });
    }

    /** Xử lý khi người dùng nhập ký tự */
    onInput() {
        const query = this.input.value.trim().toLowerCase();
        this.renderDropdown(query);
    }

    /** Cập nhật vị trí đang được trỏ bằng phím mũi tên */
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

    /** Chọn một tác giả từ dropdown */
    selectAuthor(name) {
        this.input.value = name;
        this.hide();
        this.input.dispatchEvent(new Event('change'));
    }

    /** Đóng dropdown */
    hide() {
        this.dropdown.classList.remove('active');
        this.selectedIndex = -1;
    }

    /** Lọc tác giả và hiển thị danh sách gợi ý */
    renderDropdown(query) {
        const rawVal = this.input.value.trim();
        // Lọc các tác giả có tên chứa từ khóa
        const matches = this.authors.filter(a => {
            const name = (typeof a === 'string' ? a : a.name).toLowerCase();
            return !query || name.includes(query);
        });

        // Kiểm tra xem tên đã gõ có trùng khớp hoàn toàn với tác giả cũ nào không
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

        // Lắng nghe sự kiện click trên từng mục gợi ý
        this.dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
            el.addEventListener('click', () => {
                const val = el.getAttribute('data-val');
                this.selectAuthor(val);
            });
        });
    }
}
