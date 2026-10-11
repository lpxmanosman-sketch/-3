/**
 * MANON Luxury Storefront JS (100% Static & Standalone Edition)
 * No Database or Backend Server Required!
 */

const WHATSAPP_PHONE = '201273572887';

// Product Catalog Data for Static Quick Lookups
const PRODUCTS_DATA = {
    '1': { id: '1', name: 'عباية ملكية كلوش حرير أسود فاخر', price: 1850, image: 'uploads/products/abaya-1.png', link: 'product-1.html' },
    '2': { id: '2', name: 'عباية سهرة مطرزة يدوياً بالخرز واللؤلؤ', price: 2400, image: 'uploads/products/abaya-2.png', link: 'product-2.html' },
    '3': { id: '3', name: 'عباية كاجوال عملية لينين صيفي بجيوب', price: 1350, image: 'uploads/products/abaya-3.png', link: 'product-3.html' },
    '4': { id: '4', name: 'عباية استقبال شيفون دبل كلوش راقية', price: 1950, image: 'uploads/products/abaya-4.png', link: 'product-4.html' },
    '5': { id: '5', name: 'عباية بشت خليجي مطرزة بخيوط القصب الذهبي', price: 2800, image: 'uploads/products/abaya-5.png', link: 'product-5.html' },
    '6': { id: '6', name: 'عباية بليزر عصرية كريب ملكي كحلي', price: 1650, image: 'uploads/products/abaya-6.png', link: 'product-6.html' }
};

// Cart Helper Functions
function getCart() {
    try {
        const cart = localStorage.getItem('manon_cart');
        return cart ? JSON.parse(cart) : [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem('manon_cart', JSON.stringify(cart));
        updateCartBadge();
    } catch (e) {
        console.error(e);
    }
}

function updateCartBadge() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    document.querySelectorAll('.cart-count-val').forEach(el => {
        el.textContent = count;
        el.style.transform = 'scale(1.2)';
        setTimeout(() => el.style.transform = 'scale(1)', 200);
    });
}

function formatPrice(num) {
    return Number(num).toLocaleString('ar-EG') + ' جنيه';
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Badge Update
    updateCartBadge();

    // 2. Sticky Navbar Effect
    const navbar = document.querySelector('.navbar-manon');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 30) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // 3. Add to Cart Handling (Offline & LocalStorage Supported)
    document.querySelectorAll('.btn-add-cart-ajax').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.dataset.id || '1';
            const sizeSelect = document.getElementById('productSizeSelect');
            const qtyInput = document.getElementById('productQtyInput');
            const colorInput = document.getElementById('productColorInput');

            const size = sizeSelect ? sizeSelect.value : (this.dataset.size || '54');
            const color = colorInput ? colorInput.value : (this.dataset.color || 'أسود ملكي');
            const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : (parseInt(this.dataset.qty) || 1);

            const pInfo = PRODUCTS_DATA[productId] || {
                id: productId,
                name: document.querySelector('.product-title, h1')?.textContent?.trim() || 'عباية منون الفاخرة',
                price: 1850,
                image: 'uploads/products/abaya-1.png'
            };

            const originalHtml = this.innerHTML;
            this.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> جاري الإضافة...';
            this.disabled = true;

            setTimeout(() => {
                let cart = getCart();
                const cartKey = `${productId}_${size}_${color}`;
                const existingIndex = cart.findIndex(item => item.key === cartKey);

                if (existingIndex > -1) {
                    cart[existingIndex].quantity += quantity;
                } else {
                    cart.push({
                        key: cartKey,
                        id: productId,
                        name: pInfo.name,
                        price: pInfo.price,
                        image: pInfo.image,
                        size: size,
                        color: color,
                        quantity: quantity
                    });
                }

                saveCart(cart);

                this.innerHTML = originalHtml;
                this.disabled = false;
                showToast(`تمت إضافة "${pInfo.name}" إلى سلتكِ بنجاح 🤍`, 'success');
            }, 300);
        });
    });

    // 4. Cart Page Dynamic Rendering (cart.html)
    const cartContainer = document.querySelector('.container.py-5');
    if (cartContainer && window.location.pathname.includes('cart.html')) {
        renderCartPage();
    }

    // 5. Checkout Page Dynamic Rendering (checkout.html)
    const checkoutForm = document.getElementById('staticCheckoutForm');
    if (checkoutForm) {
        renderCheckoutSummary();

        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('custName').value.trim();
            const phone = document.getElementById('custPhone').value.trim();
            const city = document.getElementById('custCity').value;
            const address = document.getElementById('custAddress').value.trim();
            const notes = document.getElementById('custNotes').value.trim();
            const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'الدفع عند الاستلام';

            const cart = getCart();
            if (cart.length === 0) {
                showToast('سلة المشتريات فارغة!', 'error');
                return;
            }

            let subtotal = 0;
            let itemsText = '';
            cart.forEach((item, index) => {
                const totalItemPrice = item.price * item.quantity;
                subtotal += totalItemPrice;
                itemsText += `\n${index + 1}) *${item.name}*\n   - المقاس: ${item.size} | اللون: ${item.color}\n   - العدد: ${item.quantity} × ${item.price} ج = *${totalItemPrice} جنيه*`;
            });

            const discount = localStorage.getItem('manon_applied_discount') ? parseInt(localStorage.getItem('manon_applied_discount')) : 0;
            const finalTotal = Math.max(0, subtotal - discount);

            const orderNum = 'MANON-' + Math.floor(100000 + Math.random() * 900000);

            // Construct Full WhatsApp Message
            let msg = `*طلب جديد من متجر مانون (MANON)* 🖤✨\n` +
                      `رقم الطلب: *#${orderNum}*\n` +
                      `--------------------------------\n` +
                      `👤 *الاسم:* ${name}\n` +
                      `📱 *الهاتف:* ${phone}\n` +
                      `📍 *المحافظة:* ${city}\n` +
                      `🏠 *العنوان:* ${address}\n` +
                      (notes ? `📝 *ملاحظات:* ${notes}\n` : '') +
                      `💳 *طريقة الدفع:* ${paymentMethod}\n` +
                      `--------------------------------\n` +
                      `📦 *المنتجات المطلوبة:*` +
                      itemsText + `\n` +
                      `--------------------------------\n` +
                      `💰 *المجموع الفرعي:* ${subtotal} جنيه\n` +
                      `🚚 *الشحن:* مجاني ✨\n` +
                      (discount > 0 ? `🎟️ *الخصم:* -${discount} جنيه\n` : '') +
                      `✨ *الإجمالي النهائي المطلوب:* *${finalTotal} جنيه*\n` +
                      `--------------------------------\n` +
                      `أرجو تأكيد الطلب وموعد الشحن. شكراً لكم 🤍`;

            const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;

            // Clear Cart and Open WhatsApp
            saveCart([]);
            localStorage.removeItem('manon_applied_discount');

            showToast('تم تجهيز طلبكِ بنجاح! جاري تحويلكِ إلى واتساب...', 'success');
            setTimeout(() => {
                window.open(waUrl, '_blank');
                window.location.href = 'index.html';
            }, 1000);
        });
    }

    // 6. Special Order Form (Direct WhatsApp Submission)
    const specialOrderForm = document.getElementById('specialOrderForm');
    if (specialOrderForm) {
        specialOrderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector('button[type="submit"]');
            const origHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> جاري تجهيز الطلب...';
            submitBtn.disabled = true;

            const name = this.querySelector('[name="name"]')?.value || 'عميلة مميزة';
            const phone = this.querySelector('[name="phone"]')?.value || '';
            const type = this.querySelector('[name="abaya_type"]')?.value || 'تفصيل خاص';
            const size = this.querySelector('[name="size"]')?.value || 'غير محدد';
            const color = this.querySelector('[name="color"]')?.value || 'أسود ملكي';
            const notes = this.querySelector('[name="notes"]')?.value || '';

            const msg = `*طلب تفصيل خاص جديد - MANON | مانون* 🖤✨\n` +
                        `--------------------------------\n` +
                        `👤 *الاسم:* ${name}\n` +
                        `📱 *الهاتف:* ${phone}\n` +
                        `👗 *نوع العباية المطلوب:* ${type}\n` +
                        `📏 *المقاس المطلوب:* ${size}\n` +
                        `🎨 *اللون المفضل:* ${color}\n` +
                        (notes ? `📝 *ملاحظات وتفاصيل:* ${notes}\n` : '') +
                        `--------------------------------\n` +
                        `📍 أرجو التواصل معي لتأكيد مواعيد التفصيل والمقاسات.`;

            const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;

            setTimeout(() => {
                submitBtn.innerHTML = origHtml;
                submitBtn.disabled = false;
                showToast('تم تسجيل طلبكِ الخاص! جاري فتح واتساب...', 'success');
                specialOrderForm.reset();
                setTimeout(() => {
                    window.open(waUrl, '_blank');
                }, 600);
            }, 400);
        });
    }

    // 7. Customer Review Form (Instant Client-Side Feedback)
    const reviewForm = document.getElementById('customerReviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector('button[type="submit"]');
            const origHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> جاري الإرسال...';
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.innerHTML = origHtml;
                submitBtn.disabled = false;
                showToast('شكراً لمشاركتكِ تقييمكِ الرائع مع مانون! 🤍', 'success');
                reviewForm.reset();
                const modalEl = document.getElementById('addReviewModal');
                if (modalEl && typeof bootstrap !== 'undefined') {
                    const m = bootstrap.Modal.getInstance(modalEl);
                    if (m) m.hide();
                }
            }, 400);
        });
    }

    // 8. Welcome Wheel of Fortune (Client-Side Spin & Award)
    const wheelCanvas = document.getElementById('wheelCanvas');
    const btnSpinWheel = document.getElementById('btnSpinWheel');
    const btnCopyWheelCode = document.getElementById('btnCopyWheelCode');
    const wheelModalEl = document.getElementById('welcomeWheelModal');

    if (wheelCanvas) {
        const ctx = wheelCanvas.getContext('2d');
        const sectors = [
            { label: 'خصم 10%', percent: 10, code: 'MANON10', bg: '#1B1714', text: '#C5A880' },
            { label: 'خصم 5%',  percent: 5,  code: 'MANON5',  bg: '#FAF7F2', text: '#1B1714' },
            { label: 'خصم 10%', percent: 10, code: 'MANON10', bg: '#1B1714', text: '#C5A880' },
            { label: 'خصم 5%',  percent: 5,  code: 'MANON5',  bg: '#FAF7F2', text: '#1B1714' },
            { label: 'خصم 10%', percent: 10, code: 'MANON10', bg: '#1B1714', text: '#C5A880' },
            { label: 'خصم 5%',  percent: 5,  code: 'MANON5',  bg: '#FAF7F2', text: '#1B1714' }
        ];
        const numSectors = sectors.length;
        const arc = (2 * Math.PI) / numSectors;
        const radius = wheelCanvas.width / 2;

        function drawWheel() {
            ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
            for (let i = 0; i < numSectors; i++) {
                const angle = i * arc;
                ctx.beginPath();
                ctx.fillStyle = sectors[i].bg;
                ctx.moveTo(radius, radius);
                ctx.arc(radius, radius, radius, angle, angle + arc);
                ctx.lineTo(radius, radius);
                ctx.fill();
                ctx.strokeStyle = '#D1C2A5';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.save();
                ctx.translate(radius, radius);
                ctx.rotate(angle + arc / 2);
                ctx.textAlign = 'right';
                ctx.fillStyle = sectors[i].text;
                ctx.font = 'bold 15px Alexandria, sans-serif';
                ctx.fillText(sectors[i].label, radius - 20, 6);
                ctx.restore();
            }
        }
        drawWheel();

        let currentRotation = 0;
        if (btnSpinWheel) {
            btnSpinWheel.addEventListener('click', function() {
                this.disabled = true;
                this.innerHTML = '<span class="spinner-border spinner-border-sm ms-2"></span> جاري تدوير العجلة...';

                // Randomly award 10% or 5%
                const winningIndex = Math.random() < 0.6 ? 0 : 1; // 60% chance for 10% discount
                const winner = sectors[winningIndex];

                const sectorDegree = (winningIndex * (360 / numSectors)) + (360 / numSectors / 2);
                const targetRotation = 360 * 5 + (270 - sectorDegree);
                currentRotation += targetRotation;

                wheelCanvas.style.transform = `rotate(${currentRotation}deg)`;

                setTimeout(() => {
                    localStorage.setItem('manon_wheel_spun', 'true');
                    const actionArea = document.getElementById('wheelActionArea');
                    const resultArea = document.getElementById('wheelResultArea');
                    const winMsg = document.getElementById('wheelWinMessage');
                    const resCode = document.getElementById('wheelResultCode');

                    if (winMsg) winMsg.textContent = `🎉 مبروك! حصلتِ على كود خصم ${winner.percent}%`;
                    if (resCode) resCode.textContent = winner.code;
                    if (actionArea) actionArea.classList.add('d-none');
                    if (resultArea) resultArea.classList.remove('d-none');

                    showToast(`مبروك! فزتِ بكود خصم ${winner.percent}% (${winner.code})`, 'success');
                }, 4200);
            });
        }
    }

    // Copy Wheel Coupon Code
    if (btnCopyWheelCode) {
        btnCopyWheelCode.addEventListener('click', function() {
            const codeEl = document.getElementById('wheelResultCode');
            if (codeEl) {
                navigator.clipboard.writeText(codeEl.textContent.trim()).then(() => {
                    showToast('تم نسخ كود الخصم بنجاح!', 'success');
                    btnCopyWheelCode.innerHTML = '<i class="bi bi-check2 ms-1"></i> تم النسخ';
                    setTimeout(() => {
                        btnCopyWheelCode.innerHTML = '<i class="bi bi-clipboard ms-1"></i> نسخ الكود';
                    }, 2500);
                });
            }
        });
    }

    // Auto-Show Wheel of Fortune once per user
    if (wheelModalEl && typeof bootstrap !== 'undefined') {
        const hasSpun = localStorage.getItem('manon_wheel_spun');
        if (!hasSpun) {
            setTimeout(() => {
                const wheelModal = new bootstrap.Modal(wheelModalEl);
                wheelModal.show();
            }, 3000);
        }
    }

    // 9. Product Gallery Thumbnail Switcher
    const mainGalleryImg = document.getElementById('mainGalleryImg');
    if (mainGalleryImg) {
        document.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', function() {
                document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                mainGalleryImg.src = this.dataset.full;
            });
        });
    }

    // 10. Quantity Increment/Decrement
    document.querySelectorAll('.qty-btn-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.closest('.qty-control-wrap')?.querySelector('.qty-input') || document.getElementById('productQtyInput');
            if (input) {
                input.value = parseInt(input.value || 1) + 1;
                input.dispatchEvent(new Event('change'));
            }
        });
    });

    document.querySelectorAll('.qty-btn-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.closest('.qty-control-wrap')?.querySelector('.qty-input') || document.getElementById('productQtyInput');
            if (input && parseInt(input.value) > 1) {
                input.value = parseInt(input.value) - 1;
                input.dispatchEvent(new Event('change'));
            }
        });
    });
});

/**
 * Render Dynamic Cart Page Elements
 */
function renderCartPage() {
    const cart = getCart();
    const cartContainer = document.querySelector('.container.py-5');
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="bg-white p-5 rounded-4 text-center border border-secondary-subtle shadow-sm my-4">
                <div class="mb-4">
                    <i class="bi bi-bag-x text-muted" style="font-size: 4rem;"></i>
                </div>
                <h3 class="fw-bold mb-2">سلة المشتريات فارغة حالياً</h3>
                <p class="text-muted mb-4">لم تقومي بإضافة أي عباية إلى سلتكِ حتى الآن. استكشفي أحدث تصاميمنا الفاخرة!</p>
                <a href="shop.html" class="btn btn-manon-primary btn-lg">
                    <i class="bi bi-shop me-2"></i> تصفحي متجر منون
                </a>
            </div>
        `;
        return;
    }

    let subtotal = 0;
    let rowsHtml = '';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        rowsHtml += `
            <tr class="align-middle">
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <img src="${item.image}" alt="${item.name}" class="rounded-3 shadow-sm border" style="width: 75px; height: 95px; object-fit: cover;">
                        <div>
                            <h6 class="fw-bold mb-1"><a href="shop.html" class="text-dark text-decoration-none">${item.name}</a></h6>
                            <div class="small text-muted mb-1">المقاس: <span class="badge bg-secondary-subtle text-dark">${item.size}</span> | اللون: <span class="badge bg-secondary-subtle text-dark">${item.color}</span></div>
                            <div class="fw-bold text-dark d-md-none">${formatPrice(item.price)}</div>
                        </div>
                    </div>
                </td>
                <td class="text-center d-none d-md-table-cell fw-bold">${formatPrice(item.price)}</td>
                <td class="text-center">
                    <div class="d-inline-flex align-items-center border rounded-pill bg-light p-1">
                        <button class="btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none" onclick="changeQty('${item.key}', -1)"><i class="bi bi-dash"></i></button>
                        <span class="px-2 fw-bold">${item.quantity}</span>
                        <button class="btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none" onclick="changeQty('${item.key}', 1)"><i class="bi bi-plus"></i></button>
                    </div>
                </td>
                <td class="text-center fw-bold text-dark">${formatPrice(itemTotal)}</td>
                <td class="text-center">
                    <button class="btn btn-sm text-danger hover-opacity-100" onclick="removeCartItem('${item.key}')" title="حذف">
                        <i class="bi bi-trash3 fs-5"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    cartContainer.innerHTML = `
        <div class="row g-4">
            <div class="col-lg-8">
                <div class="bg-white p-4 rounded-4 shadow-sm border border-secondary-subtle">
                    <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                        <h5 class="fw-bold mb-0">منتجاتكِ المختارة (${cart.length})</h5>
                        <button class="btn btn-sm btn-outline-danger" onclick="clearCart()"><i class="bi bi-trash3 me-1"></i> إفراغ السلة</button>
                    </div>
                    <div class="table-responsive">
                        <table class="table align-middle">
                            <thead class="table-light small">
                                <tr>
                                    <th>العباية</th>
                                    <th class="text-center d-none d-md-table-cell">السعر</th>
                                    <th class="text-center">الكمية</th>
                                    <th class="text-center">الإجمالي</th>
                                    <th class="text-center"></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="bg-white p-4 rounded-4 shadow-sm border border-secondary-subtle sticky-top" style="top: 100px;">
                    <h5 class="fw-bold mb-3 pb-2 border-bottom">ملخص السلة</h5>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">المجموع الفرعي:</span>
                        <span class="fw-bold">${formatPrice(subtotal)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-3 text-success">
                        <span>مصاريف الشحن:</span>
                        <span class="fw-bold">مجاني ✨</span>
                    </div>
                    <div class="d-flex justify-content-between fs-5 fw-bold border-top pt-3 mb-4">
                        <span>الإجمالي:</span>
                        <span class="text-primary-manon">${formatPrice(subtotal)}</span>
                    </div>
                    <a href="checkout.html" class="btn btn-manon-primary btn-lg w-100 mb-3 shadow-sm">
                        <i class="bi bi-credit-card me-2"></i> متابعة إتمام الطلب
                    </a>
                    <a href="shop.html" class="btn btn-outline-dark w-100">
                        <i class="bi bi-arrow-right me-1"></i> استكمال التسوق
                    </a>
                </div>
            </div>
        </div>
    `;
}

function changeQty(key, delta) {
    let cart = getCart();
    const item = cart.find(i => i.key === key);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.key !== key);
        }
        saveCart(cart);
        renderCartPage();
    }
}

function removeCartItem(key) {
    let cart = getCart();
    cart = cart.filter(i => i.key !== key);
    saveCart(cart);
    renderCartPage();
    showToast('تمت إزالة العباية من السلة', 'success');
}

function clearCart() {
    if (confirm('هل أنتِ متأكدة من إفراغ سلة المشتريات بالكامل؟')) {
        saveCart([]);
        renderCartPage();
        showToast('تم إفراغ السلة', 'success');
    }
}

/**
 * Render Dynamic Summary on Checkout Page (checkout.html)
 */
function renderCheckoutSummary() {
    const listEl = document.getElementById('checkoutItemsList');
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const totalEl = document.getElementById('checkoutTotal');
    if (!listEl || !subtotalEl || !totalEl) return;

    let cart = getCart();

    // If empty on checkout, populate with default featured abaya so user can test seamlessly
    if (cart.length === 0) {
        cart = [{
            key: '1_54_أسود',
            id: '1',
            name: 'عباية ملكية كلوش حرير أسود فاخر',
            price: 1850,
            image: 'uploads/products/abaya-1.png',
            size: '54',
            color: 'أسود ملكي',
            quantity: 1
        }];
        saveCart(cart);
    }

    let subtotal = 0;
    let html = '';
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        html += `
            <div class="d-flex align-items-center gap-3 mb-3 pb-2 border-bottom">
                <img src="${item.image}" alt="${item.name}" class="rounded-3 border" style="width: 55px; height: 70px; object-fit: cover;">
                <div class="flex-grow-1">
                    <h6 class="small fw-bold mb-1">${item.name}</h6>
                    <div class="small text-muted">مقاس: ${item.size} | ${item.color} | عدد: ${item.quantity}</div>
                </div>
                <div class="fw-bold small text-dark">${formatPrice(itemTotal)}</div>
            </div>
        `;
    });

    listEl.innerHTML = html;
    subtotalEl.textContent = formatPrice(subtotal);
    totalEl.textContent = formatPrice(subtotal);
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'success') {
    let toast = document.getElementById('manonToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'manonToast';
        toast.className = 'manon-toast';
        document.body.appendChild(toast);
    }

    const icon = type === 'success' 
        ? '<i class="bi bi-check-circle-fill text-success fs-5"></i>' 
        : '<i class="bi bi-exclamation-triangle-fill text-warning fs-5"></i>';

    toast.innerHTML = `
        ${icon}
        <div>
            <div class="fw-bold">${type === 'success' ? 'متجر منون' : 'تنبيه'}</div>
            <div class="small opacity-75">${message}</div>
        </div>
    `;

    toast.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3800);
}
