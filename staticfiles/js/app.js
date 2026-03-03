// API конфигурация (явный origin, чтобы запросы не зависели от пути /en/ или /ru/)
const API_URL = (typeof window !== 'undefined' && window.location && window.location.origin)
    ? window.location.origin + '/api'
    : '/api';
const APP_LANG = (document.documentElement.lang || 'ru').toLowerCase().startsWith('en') ? 'en' : 'ru';

function t(key) {
    const ru = {
        fill_dates: 'Пожалуйста, заполните обе даты',
        checkout_after_checkin: 'Дата выезда должна быть позже даты заезда',
        error_load_rooms: 'Ошибка при загрузке комнат',
        login_required_booking: 'Пожалуйста, войдите в систему для бронирования',
        error_booking: 'Ошибка при бронировании',
        login_failed: 'Неверное имя пользователя или пароль',
        welcome: name => `Добро пожаловать, ${name}!`,
        password_mismatch: 'Пароли не совпадают',
        register_login_failed: 'Регистрация выполнена, но не удалось войти',
        session_expired: 'Сессия истекла. Пожалуйста, войдите в систему и попробуйте снова.',
        session_expired_short: 'Сессия истекла. Пожалуйста, войдите в систему ещё раз.',
        login_required: 'Пожалуйста, войдите в систему',
        error_load_bookings: 'Ошибка при загрузке бронирований',
        no_rooms: 'Нет доступных комнат',
        try_other_dates: 'Попробуйте другие даты',
        guests_label: '👥 Мест',
        price_per_night: '₽/сутки',
        book_button: 'Забронировать',
        no_bookings: 'У вас нет бронирований',
        booking_number: 'Номер брони',
        status_active: '✓ Активна',
        status_cancelled: '✗ Отменена',
        cancel_booking_confirm: 'Вы уверены, что хотите отменить бронь?',
        cancel_booking_error: 'Ошибка при отмене бронирования',
        cancel_booking_success: 'Бронь успешно отменена',
        logout_success: 'Вы вышли из системы',
        loading: 'Загрузка...',
    };
    const en = {
        fill_dates: 'Please fill in both dates',
        checkout_after_checkin: 'Check-out date must be later than check-in date',
        error_load_rooms: 'Error loading rooms',
        login_required_booking: 'Please log in to book a room',
        error_booking: 'Error while booking',
        login_failed: 'Incorrect username or password',
        welcome: name => `Welcome, ${name}!`,
        password_mismatch: 'Passwords do not match',
        register_login_failed: 'Registered, but failed to log in',
        session_expired: 'Session expired. Please log in and try again.',
        session_expired_short: 'Session expired. Please log in again.',
        login_required: 'Please log in first',
        error_load_bookings: 'Error loading bookings',
        no_rooms: 'No available rooms',
        try_other_dates: 'Try other dates',
        guests_label: '👥 Guests',
        price_per_night: '₽/night',
        book_button: 'Book',
        no_bookings: 'You have no bookings',
        booking_number: 'Booking number',
        status_active: '✓ Active',
        status_cancelled: '✗ Cancelled',
        cancel_booking_confirm: 'Are you sure you want to cancel this booking?',
        cancel_booking_error: 'Error cancelling booking',
        cancel_booking_success: 'Booking successfully cancelled',
        logout_success: 'You have been logged out',
        loading: 'Loading...',
    };
    const dict = APP_LANG === 'en' ? en : ru;
    const value = dict[key];
    return typeof value === 'undefined' ? key : value;
}

// Валюты и форматирование цен (perRub — сколько единиц валюты за 1 RUB)
const CURRENCIES = {
    RUB: { perRub: 1, symbol: '₽' },
    USD: { perRub: 0.011, symbol: '$' }, // примерные курсы
    EUR: { perRub: 0.01, symbol: '€' },
    KZT: { perRub: 5, symbol: '₸' },
};

let CURRENT_CURRENCY = localStorage.getItem('currency') || 'RUB';
if (!Object.prototype.hasOwnProperty.call(CURRENCIES, CURRENT_CURRENCY)) {
    CURRENT_CURRENCY = 'RUB';
}

function convertAmount(amount, fromCode, toCode) {
    const from = CURRENCIES[fromCode] || CURRENCIES.RUB;
    const to = CURRENCIES[toCode] || CURRENCIES.RUB;
    if (fromCode === toCode) {
        return amount;
    }

    // из базовой валюты в рубли
    let rub;
    if (fromCode === 'RUB') {
        rub = amount;
    } else {
        // from.perRub = FROM per 1 RUB => 1 FROM = 1 / perRub RUB
        rub = amount / from.perRub;
    }

    // из рублей в целевую валюту
    if (toCode === 'RUB') {
        return rub;
    }
    return rub * to.perRub;
}

function formatAmount(amount, baseCurrency) {
    const value = convertAmount(amount, baseCurrency, CURRENT_CURRENCY);
    const cfg = CURRENCIES[CURRENT_CURRENCY];
    return `${value.toFixed(2)} ${cfg.symbol}`;
}

function formatPerNight(amount, baseCurrency) {
    const value = convertAmount(amount, baseCurrency, CURRENT_CURRENCY);
    const cfg = CURRENCIES[CURRENT_CURRENCY];
    const suffix = APP_LANG === 'en' ? '/night' : '/сутки';
    return `${value.toFixed(2)} ${cfg.symbol}${suffix}`;
}

function localizeRoomName(roomName) {
    return roomName;
}

function setCurrency(code) {
    if (!Object.prototype.hasOwnProperty.call(CURRENCIES, code)) {
        return;
    }
    CURRENT_CURRENCY = code;
    localStorage.setItem('currency', code);
    updateRoomPrices();
    updateBookingModalPrices();
}

function updateRoomPrices() {
    document.querySelectorAll('.room-price').forEach(el => {
        const price = parseFloat(el.dataset.price);
        const currency = el.dataset.currency || 'RUB';
        if (!isNaN(price)) {
            el.textContent = formatPerNight(price, currency);
        }
    });
}

function updateBookingModalPrices() {
    const details = document.getElementById('booking-details');
    if (!details) return;
    // если в деталях уже есть data-атрибуты, можно их использовать,
    // но для простоты модальное окно будет перерисовано при каждом открытии.
}

let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    setMinDate();
});

// Инициализация приложения
function initializeApp() {
    console.log('Инициализация приложения...');
    if (authToken) {
        // попытка получить дополнительные данные о пользователе
        fetchCurrentUser().finally(() => {
            showLoggedInState();
        });
    } else {
        showLoggedOutState();
    }
}

// запрашивает /auth/user/ и заполняет флаг is_staff
async function fetchCurrentUser() {
    if (!authToken) return;
    try {
        const response = await fetch(`${API_URL}/auth/user/`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            currentUser = { ...currentUser, ...data };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    } catch (e) {
        console.warn('Не удалось загрузить информацию о пользователе', e);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log('Настройка обработчиков событий...');
    
    // Форма поиска
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
        console.log('✓ Обработчик search-form добавлен');
    } else {
        console.warn('✗ search-form не найдена');
    }

    // Переключатель валюты
    const currencySelect = document.getElementById('currency-select');
    if (currencySelect) {
        currencySelect.value = CURRENT_CURRENCY;
        currencySelect.addEventListener('change', (e) => {
            setCurrency(e.target.value);
        });
    }

    // Модальное окно
    const authModal = document.getElementById('auth-modal');
    const bookingModal = document.getElementById('booking-modal');
    
    const loginLink = document.getElementById('login-link');
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Клик по login-link');
            redirectToAdmin = false; // regular login
            openModal(authModal);
        });
    }
    // admin button in navbar
    const adminLink = document.getElementById('admin-link');
    if (adminLink) {
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Клик по admin-link');
            redirectToAdmin = true;
            openModal(authModal);
        });
    }
    
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            console.log('Клик по login-button');
            openModal(authModal);
        });
        console.log('✓ Обработчик login-button добавлен');
    } else {
        console.warn('✗ login-button не найдена');
    }
    
    const registerButton = document.getElementById('register-button');
    if (registerButton) {
        registerButton.addEventListener('click', () => {
            console.log('Клик по register-button');
            switchTab('register');
            openModal(authModal);
        });
        console.log('✓ Обработчик register-button добавлен');
    } else {
        console.warn('✗ register-button не найдена');
    }

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    const adminBtn = document.getElementById('admin-button');
    if (adminBtn) {
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // if user is already logged in with session, just go
            const lang = document.documentElement.lang || 'en';
            window.location.href = `/${lang}/admin/`;
        });
    }

    // Закрытие модальных окон
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            bookingModal.style.display = 'none';
        });
    });

    // Табы входа/регистрации
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.getAttribute('data-tab'));
        });
    });

    // Формы входа и регистрации
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✓ Обработчик login-form добавлен');
    } else {
        console.warn('✗ login-form не найдена');
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        console.log('✓ Обработчик register-form добавлен');
    } else {
        console.warn('✗ register-form не найдена');
    }

    // Навигация
    const bookingsLink = document.getElementById('bookings-link');
    if (bookingsLink) {
        bookingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadMyBookings();
        });
    }

    // Кнопки в правом блоке карточки
    const myBookingsButton = document.getElementById('my-bookings-button');
    if (myBookingsButton) {
        myBookingsButton.addEventListener('click', (e) => {
            e.preventDefault();
            loadMyBookings();
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    const backToSearchButton = document.getElementById('back-to-search-button');
    if (backToSearchButton) {
        backToSearchButton.addEventListener('click', (e) => {
            e.preventDefault();
            goBackToSearch();
        });
    }

    const logoutButtonBookings = document.getElementById('logout-button-bookings');
    if (logoutButtonBookings) {
        logoutButtonBookings.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Закрытие модальных окон при клике вне
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
        if (e.target === bookingModal) {
            bookingModal.style.display = 'none';
        }
    });
}

// Установка минимальной даты на сегодня
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('check-in').setAttribute('min', today);
    document.getElementById('check-out').setAttribute('min', today);
    
    // Установка дефолтных дат (сегодня и завтра)
    document.getElementById('check-in').valueAsDate = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('check-out').valueAsDate = tomorrow;
}

// Поиск комнат
async function handleSearch(e) {
    e.preventDefault();
    
    const checkIn = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;

    if (!checkIn || !checkOut) {
        showError(t('fill_dates'));
        return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
        showError(t('checkout_after_checkin'));
        return;
    }

    try {
        showLoading();
        const response = await fetch(
            `${API_URL}/rooms/available/?check_in=${checkIn}&check_out=${checkOut}`
        );

        if (!response.ok) {
            let message = t('error_load_rooms');
            try {
                const data = await response.json();
                if (data && (data.error || data.detail)) {
                    message = typeof data.detail === 'string' ? data.detail : (data.error || message);
                }
            } catch (_) {}
            throw new Error(message);
        }

        const rooms = await response.json();
        displayRooms(rooms, checkIn, checkOut);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Отображение комнат
function displayRooms(rooms, checkIn, checkOut) {
    const resultsSection = document.getElementById('results-section');
    const roomsGrid = document.getElementById('rooms-grid');
    
    if (rooms.length === 0) {
        roomsGrid.innerHTML = `<div class="empty-state"><h3>${t('no_rooms')}</h3><p>${t('try_other_dates')}</p></div>`;
    } else {
        roomsGrid.innerHTML = rooms.map(room => {
            const price = Number(room.price_per_day);
            const baseCurrency = room.currency || 'RUB';
            return `
            <div class="room-card">
                <h3>${localizeRoomName(room.name)}</h3>
                <div class="room-info">
                    <span class="room-capacity">${t('guests_label')}: ${room.capacity}</span>
                </div>
                <div class="room-price" data-price="${price}" data-currency="${baseCurrency}">${formatPerNight(price, baseCurrency)}</div>
                <button class="btn btn-primary" 
                        onclick="openBookingModal(${room.id}, '${room.name}', ${price}, '${baseCurrency}', '${checkIn}', '${checkOut}')">
                    ${t('book_button')}
                </button>
            </div>
        `;
        }).join('');
    }
    
    resultsSection.style.display = 'block';
    hideLoading();
}

// Открытие модального окна бронирования
function openBookingModal(roomId, roomName, price, priceCurrency, checkIn, checkOut) {
    if (!authToken) {
        showError(t('login_required_booking'));
        document.getElementById('auth-modal').style.display = 'flex';
        return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalBase = nights * parseFloat(price);

    const details = document.getElementById('booking-details');
    const roomLabel = APP_LANG === 'en' ? 'Room:' : 'Комната:';
    const checkInLabel = APP_LANG === 'en' ? 'Check-in date:' : 'Дата заезда:';
    const checkOutLabel = APP_LANG === 'en' ? 'Check-out date:' : 'Дата выезда:';
    const nightsLabel = APP_LANG === 'en' ? 'Nights:' : 'Количество ночей:';
    const pricePerNightLabel = APP_LANG === 'en' ? 'Price per night:' : 'Цена за ночь:';
    const totalLabel = APP_LANG === 'en' ? 'Total:' : 'Итого:';
    const locale = APP_LANG === 'en' ? 'en-GB' : 'ru-RU';

    details.innerHTML = `
        <strong>${roomLabel}</strong> ${localizeRoomName(roomName)}<br>
        <strong>${checkInLabel}</strong> ${new Date(checkIn).toLocaleDateString(locale)}<br>
        <strong>${checkOutLabel}</strong> ${new Date(checkOut).toLocaleDateString(locale)}<br>
        <strong>${nightsLabel}</strong> ${nights}<br>
        <strong>${pricePerNightLabel}</strong> ${formatPerNight(price, priceCurrency)}<br>
        <strong>${totalLabel}</strong> <span style="color: #667eea; font-weight: bold;">${formatAmount(totalBase, priceCurrency)}</span>
    `;

    document.getElementById('confirm-booking').onclick = () => {
        confirmBooking(roomId, checkIn, checkOut);
    };

    document.getElementById('booking-modal').style.display = 'flex';
}

// Подтверждение бронирования
async function confirmBooking(roomId, checkIn, checkOut) {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/bookings/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                room_id: roomId,
                check_in: checkIn,
                check_out: checkOut
            })
        });

        if (!response.ok) {
            // если токен истёк или невалиден — выходим из системы
            if (response.status === 401) {
                logout();
                throw new Error(t('session_expired'));
            }
            let message = t('error_booking');
            try {
                const error = await response.json();
                if (error && (error.error || error.detail)) {
                    message = error.error || error.detail;
                }
            } catch (_) {
                // ответ не JSON – оставляем сообщение по умолчанию
            }
            throw new Error(message);
        }

        const booking = await response.json();
        document.getElementById('booking-modal').style.display = 'none';
        showSuccess(APP_LANG === 'en' ? 'Room successfully booked!' : 'Комната успешно забронирована!');
        
        // Обновляем список бронений
        setTimeout(() => {
            loadMyBookings();
        }, 1500);
    } catch (error) {
        showError(error.message);
    }
}

// Вход
async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const username = form.querySelector('input[type="text"]').value;
    const password = form.querySelector('input[type="password"]').value;

    try {
        showLoading();
        const response = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error(t('login_failed'));
        }

        const data = await response.json();
        authToken = data.access;
        currentUser = { username, email: '' };
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        document.getElementById('auth-modal').style.display = 'none';
        form.reset();
        
        // fetch extra user info (is_staff etc) then update UI
        await fetchCurrentUser();
        showLoggedInState();
        showSuccess(t('welcome')(username));
        hideLoading();

        // если входился для админки, сделать редирект
        if (redirectToAdmin) {
            redirectToAdmin = false;
            loginToAdmin(username, password);
        }
    } catch (error) {
        showError(error.message);
    }
}

// helper that submits credentials to the Django admin login form and
// navigates the browser there.  We include a csrftoken from cookies so the
// standard admin login will accept the POST and set the session.
async function loginToAdmin(username, password) {
    const lang = document.documentElement.lang || 'en';
    const loginUrl = `/${lang}/admin/login/`;
    const action = `${loginUrl}?next=/${lang}/admin/`;

    // fetch login page first so that Django sets the csrftoken cookie
    try {
        await fetch(loginUrl, { credentials: 'same-origin' });
    } catch (e) {
        // network failure isn't fatal; we'll submit anyway and let Django
        // reject if the CSRF header is missing
        console.warn('failed to preload admin page for csrf', e);
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    form.style.display = 'none';

    const u = document.createElement('input');
    u.name = 'username';
    u.value = username;
    form.appendChild(u);

    const p = document.createElement('input');
    p.name = 'password';
    p.value = password;
    form.appendChild(p);

    const cookie = document.cookie.split('; ').find(c => c.startsWith('csrftoken='));
    if (cookie) {
        const token = cookie.split('=')[1];
        const csrf = document.createElement('input');
        csrf.type = 'hidden';
        csrf.name = 'csrfmiddlewaretoken';
        csrf.value = token;
        form.appendChild(csrf);
    }

    document.body.appendChild(form);
    form.submit();
}

// Регистрация
async function handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    const inputs = form.querySelectorAll('input');
    const username = inputs[0].value.trim();
    const email = inputs[1].value.trim();
    const password = inputs[2].value;
    const passwordConfirm = inputs[3].value;

    if (password !== passwordConfirm) {
        showError(t('password_mismatch'));
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_URL}/auth/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Запрос запрещён сервером (проверьте CSRF или настройки CORS)');
            }
            const errorData = await response.json().catch(() => null);
            // сериализатор может вернуть объект с ошибками
            const msg = errorData
                ? (Array.isArray(errorData)
                    ? errorData.join(', ')
                    : Object.values(errorData)[0] || 'Ошибка регистрации')
                : 'Не удалось разобрать ответ сервера';
            throw new Error(msg);
        }

        // После успешной регистрации автоматически логиним пользователя
        // (используем те же данные, что ввёл пользователь)
        const loginResponse = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!loginResponse.ok) {
            throw new Error(t('register_login_failed'));
        }
        const loginData = await loginResponse.json();
        authToken = loginData.access;
        currentUser = { username, email };
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // try to fill additional fields from server (is_staff etc)
        await fetchCurrentUser();

        document.getElementById('auth-modal').style.display = 'none';
        form.reset();
        showLoggedInState();
        showSuccess(t('welcome')(username));
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Вернуться к поиску (со страницы «Мои брони»)
function goBackToSearch() {
    document.getElementById('bookings-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
}

// Выход из системы
function logout() {
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;

    showLoggedOutState();
    document.getElementById('bookings-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    showSuccess(t('logout_success'));
}

// Загрузка моих бронирований
async function loadMyBookings() {
    if (!authToken) {
        showError(t('login_required'));
        return;
    }

    const bookingsList = document.getElementById('bookings-list');
    const bookingsSection = document.getElementById('bookings-section');

    document.getElementById('main-content').style.display = 'none';
    bookingsSection.style.display = 'block';
    if (bookingsList) {
        bookingsList.innerHTML = `<div class="loading"><div class="spinner"></div>${t('loading')}</div>`;
    }
    const userNameEl = document.getElementById('bookings-user-name');
    if (userNameEl && currentUser && currentUser.username) {
        userNameEl.textContent = currentUser.username;
    }

    try {
        const response = await fetch(`${API_URL}/bookings/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                throw new Error(t('session_expired_short'));
            }
            let message = t('error_load_bookings');
            try {
                const data = await response.json();
                if (data && (data.error || data.detail)) {
                    message = typeof data.detail === 'string' ? data.detail : (data.error || message);
                }
            } catch (_) {}
            throw new Error(message);
        }

        const bookings = await response.json();
        displayBookings(bookings);
    } catch (error) {
        showError(error.message);
        if (bookingsList) {
            bookingsList.innerHTML = `<div class="empty-state"><h3>${error.message}</h3></div>`;
        }
    }
}

// Отображение бронирований
function displayBookings(bookings) {
    const bookingsList = document.getElementById('bookings-list');
    
    if (bookings.length === 0) {
        bookingsList.innerHTML = `<div class="empty-state"><h3>${t('no_bookings')}</h3></div>`;
        return;
    }

    bookingsList.innerHTML = bookings.map(booking => `
        <div class="booking-card">
            <h3>${booking.room_name}</h3>
            <div class="booking-info">
                <strong>${APP_LANG === 'en' ? 'Check-in date:' : 'Дата заезда:'}</strong> ${new Date(booking.check_in).toLocaleDateString(APP_LANG === 'en' ? 'en-GB' : 'ru-RU')}<br>
                <strong>${APP_LANG === 'en' ? 'Check-out date:' : 'Дата выезда:'}</strong> ${new Date(booking.check_out).toLocaleDateString(APP_LANG === 'en' ? 'en-GB' : 'ru-RU')}<br>
                <strong>${t('booking_number')}:</strong> #${booking.id}
            </div>
            <span class="booking-status ${booking.status}">${booking.status === 'active' ? t('status_active') : t('status_cancelled')}</span>
            ${booking.status === 'active' ? `
                <button class="btn btn-danger" onclick="cancelBooking(${booking.id})">
                    ${APP_LANG === 'en' ? 'Cancel booking' : 'Отменить бронь'}
                </button>
            ` : ''}
        </div>
    `).join('');
}

// Отмена бронирования
async function cancelBooking(bookingId) {
    if (!confirm(t('cancel_booking_confirm'))) {
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                throw new Error(t('session_expired_short'));
            }
            throw new Error(t('cancel_booking_error'));
        }

        showSuccess(t('cancel_booking_success'));
        loadMyBookings();
    } catch (error) {
        showError(error.message);
    }
}

// Переключение табов
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-tab`).classList.add('active');
}

// Открытие модального окна
function openModal(modal) {
    modal.style.display = 'flex';
}

// Состояние авторизации - вошли
function showLoggedInState() {
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const bookingsLink = document.getElementById('bookings-link');
    const navAdmin = document.getElementById('admin-link');
    if (loginLink && logoutLink && bookingsLink) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';
        bookingsLink.style.display = 'block';
    }
    if (navAdmin) {
        // show nav link only if we know the user is staff
        navAdmin.style.display = (currentUser && currentUser.is_staff) ? 'block' : 'none';
    }

    const guestBlock = document.getElementById('auth-guest');
    const userBlock = document.getElementById('auth-user');
    if (guestBlock && userBlock) {
        guestBlock.style.display = 'none';
        userBlock.style.display = 'flex';
        userBlock.style.flexDirection = 'column';
        userBlock.style.gap = '15px';
    }

    const userNameEl = document.getElementById('user-name');
    if (userNameEl && currentUser && currentUser.username) {
        userNameEl.textContent = currentUser.username;
    }

    // show admin button if allowed
    const adminBtn = document.getElementById('admin-button');
    if (adminBtn) {
        if (currentUser && currentUser.is_staff) {
            adminBtn.style.display = 'block';
        } else {
            adminBtn.style.display = 'none';
        }
    }
}

// Состояние авторизации - не вошли
function showLoggedOutState() {
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const bookingsLink = document.getElementById('bookings-link');
    const navAdmin = document.getElementById('admin-link');
    if (loginLink && logoutLink && bookingsLink) {
        loginLink.style.display = 'block';
        logoutLink.style.display = 'none';
        bookingsLink.style.display = 'none';
    }
    if (navAdmin) {
        navAdmin.style.display = 'none';
    }

    const guestBlock = document.getElementById('auth-guest');
    const userBlock = document.getElementById('auth-user');
    if (guestBlock && userBlock) {
        guestBlock.style.display = 'flex';
        guestBlock.style.flexDirection = 'column';
        guestBlock.style.gap = '15px';
        userBlock.style.display = 'none';
    }
}

// Показать сообщение об ошибке
function showError(message) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 5000);
}

// Показать сообщение об успехе
function showSuccess(message) {
    const successEl = document.getElementById('success-message');
    successEl.textContent = message;
    successEl.style.display = 'block';
    setTimeout(() => {
        successEl.style.display = 'none';
    }, 5000);
}

// Показать загрузку (не удаляя разметку секции результатов)
function showLoading() {
    const resultsSection = document.getElementById('results-section');
    const roomsGrid = document.getElementById('rooms-grid');
    if (roomsGrid) {
        roomsGrid.innerHTML = `<div class="loading"><div class="spinner"></div>${t('loading')}</div>`;
    }
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
}

// Скрыть загрузку
function hideLoading() {
    const loading = document.querySelector('#rooms-grid .loading');
    if (loading) {
        loading.remove();
    }
}
