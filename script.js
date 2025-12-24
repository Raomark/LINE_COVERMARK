let selectedProduct = "Moisture Veil LX";
const LIFF_ID = "2008756827-zANFfOMQ"; // ** เปลี่ยนเป็น LIFF ID ของคุณ **

async function initLiff() {
    try {
        await liff.init({ liffId: "YOUR_LIFF_ID" });
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            const params = new URLSearchParams(window.location.search);
            
            // 1. ถ้าเป็นผู้รับของขวัญ (ข้ามไปหน้าเขย่าเลย)
            if (params.get('mode') === 'receive') {
                showReceiverPage();
                return;
            }

            // 2. ถ้าเป็นผู้ส่ง และยังไม่มี flag ว่าลงทะเบียนแล้ว
            // หมายเหตุ: หลังจากลงทะเบียนที่ PAMS เสร็จ ต้องให้ระบบ Redirect กลับมาที่
            // URL: https://liff.line.me/YOUR_LIFF_ID?reg=success
            if (params.get('reg') !== 'success') {
                window.location.href = "https://cdp-occ-crm.pams.ai/crm/covermark/register";
                return;
            }

            // 3. ถ้าลงทะเบียนสำเร็จแล้ว แสดงหน้าเลือกของขวัญ
            document.getElementById('sender-view').classList.remove('hidden');
        }
    } catch (err) {
        console.error("LIFF Error:", err);
    }
}

// ตรวจสอบว่าเปิดลิงก์มาในฐานะ ผู้ส่ง หรือ ผู้รับ
function checkRoute() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'receive') {
        document.getElementById('sender-view').classList.add('hidden');
        document.getElementById('receiver-view').classList.remove('hidden');
        initShakeDetection();
    }
}

function selectProduct(name, el) {
    selectedProduct = name;
    document.querySelectorAll('.product-card').forEach(card => card.classList.remove('active'));
    el.classList.add('active');
}

// ฝั่งผู้ส่ง: ส่ง Flex Message
async function sendToFriend() {
    const sender = document.getElementById('senderName').value || "เพื่อนของคุณ";
    const receiver = document.getElementById('receiverName').value || "คุณ";
    const msg = document.getElementById('message').value;

    const shareUrl = `https://liff.line.me/${LIFF_ID}?mode=receive&from=${encodeURIComponent(sender)}&to=${encodeURIComponent(receiver)}&msg=${encodeURIComponent(msg)}&prod=${encodeURIComponent(selectedProduct)}`;

    if (liff.isApiAvailable('shareTargetPicker')) {
        const result = await liff.shareTargetPicker([{
            "type": "flex",
            "altText": `คุณได้รับของขวัญจากคุณ ${sender}`,
            "contents": {
                "type": "bubble",
                "hero": { "type": "image", "url": "https://placehold.co/600x400/1a1a1a/D4AF37?text=COVERMARK+GIFT", "size": "full", "aspectRatio": "20:13", "aspectMode": "cover" },
                "body": { "type": "box", "layout": "vertical", "contents": [
                    { "type": "text", "text": "EXCLUSIVE GIFT", "weight": "bold", "color": "#D4AF37", "size": "xs" },
                    { "type": "text", "text": `ถึง คุณ ${receiver}`, "weight": "bold", "size": "xl", "margin": "md" },
                    { "type": "text", "text": `ส่งมอบความสวยโดยคุณ ${sender}`, "size": "sm", "color": "#aaaaaa" }
                ]},
                "footer": { "type": "box", "layout": "vertical", "contents": [
                    { "type": "button", "action": { "type": "uri", "label": "เปิดของขวัญของคุณ", "uri": shareUrl }, "style": "primary", "color": "#1a1a1a" }
                ]}
            }
        }]);
        if (result) liff.closeWindow();
    }
}

// ฝั่งผู้รับ: ระบบเขย่า
let shakeCount = 0;
let isOpening = false;

function initShakeDetection() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        // iOS 13+ ต้องการ Permission
        document.body.addEventListener('click', () => {
            DeviceMotionEvent.requestPermission().then(state => {
                if (state === 'granted') startMotionListener();
            });
        }, { once: true });
    } else {
        startMotionListener();
    }
}

function startMotionListener() {
    window.addEventListener('devicemotion', (e) => {
        if (isOpening) return;
        const acc = e.accelerationIncludingGravity;
        const totalAcc = Math.abs(acc.x) + Math.abs(acc.y);
        
        if (totalAcc > 20) { // ระดับแรงเขย่า
            document.getElementById('gift-box-anim').classList.add('shake-active');
            shakeCount++;
            if (shakeCount > 5) startOpeningSequence();
        }
    });
}

function startOpeningSequence() {
    if (isOpening) return;
    isOpening = true;
    
    // 1. ซ่อนหน้าเขย่า แสดงหน้า Loading
    document.getElementById('shake-step').classList.add('hidden');
    document.getElementById('loading-step').classList.remove('hidden');

    // 2. รอ 5 วินาที ตามโจทย์
    setTimeout(() => {
        showFinalGift();
    }, 5000);
}

function showFinalGift() {
    const params = new URLSearchParams(window.location.search);
    document.getElementById('loading-step').classList.add('hidden');
    document.getElementById('result-step').classList.remove('hidden');
    
    document.getElementById('final-product-name').innerText = params.get('prod');
    document.getElementById('final-message').innerText = `"${params.get('msg')}" \n- จากคุณ ${params.get('from')}`;
}

initLiff();